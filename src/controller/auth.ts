/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Users from "../models/User";
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Otp from "../models/Otp";
import mongoose from "mongoose";

type UserObject = {
    _id: mongoose.Types.ObjectId,
    fName: string,
    lastName: string,
    email: string,
    token?: string,
    verified?: boolean
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({ email: email });
        if (!user) {
            throw new Error("User does not exist. ");
        }
        if (user.verified === false) {
            throw new Error('User is not verified')
        }
        
        if (false) {
            throw new Error("Invalid credentials. ");
        }
        {
            const salt = await bcrypt.genSalt();
            const updateObj = {
                email: req.body.email,
            }
            await Users.findOneAndUpdate({ email: req.body.email }, updateObj, { new: true })
                .then((savedUser => {
                    if (savedUser !== null) {
                        sentOtp(req.body.email).then(async (otp) => {
                            if (typeof otp !== 'undefined') {
                                const otpHash = await bcrypt.hash(otp?.toString(), salt)
                                const userOtp = new Otp({
                                    userId: savedUser._id,
                                    email: req.body.email,
                                    otp: otpHash
                                })
                                await userOtp.save();
                                const userObj: UserObject = {
                                    _id: savedUser._id,
                                    fName: savedUser.firstName,
                                    lastName: savedUser.lastName,
                                    email: savedUser.email,
                                };
                                return res.status(201).json({message: 'Otp Sent to Email',user:userObj} );
                            }
                        })
                        .catch((err)=>{
                            return res.status(400).json({ message: "Email Could'nt be Sent" })
                        })
                    } else {
                        return res.status(400).json({ message: "User cannot be updated" })
                    }
                }));
            }
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}


export const register = async (req: Request, res: Response) => {
    try {
        const user = await Users.findOne({ email: req.body.email });
        if (user) throw new Error('User already exists. Please try logging in')
        
        else {
            const salt = await bcrypt.genSalt();

            const newUser = new Users({
                firstName: req.body.fName,
                lastName: req.body.lName,
                email: req.body.email,
            });
            await newUser.save().then((savedUser => {
                sentOtp(req.body.email).then(async (otp) => {
                    if (typeof otp !== 'undefined') {
                        const otpHash = await bcrypt.hash(otp?.toString(), salt)
                        const userOtp = new Otp({
                            userId: savedUser._id,
                            email: req.body.email,
                            otp: otpHash
                        })
                        await userOtp.save();
                        const userObj: UserObject = {
                            _id: savedUser._id,
                            fName: savedUser.firstName,
                            lastName: savedUser.lastName,
                            email: savedUser.email,
                        };
                        return res.status(201).json({message: 'Otp Sent to Email',user:userObj} );
                    }
                })
            }));
        }
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

const sentOtp = async (email: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS,
            },
        });
        const otp = Math.floor(Math.random() * 9000) + 1000;
        const info: SMTPTransport.SentMessageInfo = await transporter.sendMail({
            from: process.env.SMTP_MAIL,
            to: email,
            subject: "Welcome to HD!",
            html: `<p>Hi there,</p>
               <p>Use this otp ${otp} to Access your Account</p>`,
        });

        console.log("Email sent:", info.response);
        if (info)
            return Promise.resolve(otp);
    } catch (error) {
        console.log("Error occured while sending mail", error);
    }
}


export const fetchOtp = async (req: Request, res: Response) => {
    const { otp,userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'Unauthorized' })
    }
    const userOtp = await Otp.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    if (userOtp) {
        const salt = await bcrypt.genSalt();
        // const otpHash = await bcrypt.hash(otp?.toString(), salt)
        const isMatch = await bcrypt.compare(otp, userOtp.otp)
        await Users.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(userId) }, { verified: true }, { new: true })
            .then(verifiedUser => {
                if (verifiedUser !== null) {
                    const userToken = jwt.sign({ id: verifiedUser._id }, process.env.JWT_SECRET as string);
                    const userObj: UserObject = {
                        _id: verifiedUser._id,
                        fName: verifiedUser.firstName,
                        lastName: verifiedUser.lastName,
                        email: verifiedUser.email,
                        token: userToken,
                        verified:true,
                    };
                    return isMatch ? res.status(200).json({ verifiedUser:userObj, message: 'Otp Verified' }) : res.status(400).json({ message: 'Incorrect Otp' })
                }
            })
    } else {
        return res.status(400).json({ message: 'Otp expired' })
    }
}