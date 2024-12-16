const { GoogleGenerativeAI } = require("@google/generative-ai");
import { json, Request, Response } from "express";


const genAI = new GoogleGenerativeAI("AIzaSyCCI9k-lCZdUjX9HjfUkrTAqk7x8LIttXI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const getAiContent = async (req: Request, res: Response) => {
  try {
    let {title} = req.body
    const prompt = ` You are a highly intelligent assistant. Please provide the content for a note with the following title: "${title}".
      Ensure the response is formatted as JSON with the following structure no fancy decorators just fill in the :
      {
        "title": "<fill_title_here>",
        "content": "<fill_content_here>"
      }`
    let result = await model.generateContent(prompt);
    let response = result.response.text();
    
    const cleanedString = response
    .trim()
    .replace(/^```json/, "") 
    .replace(/```$/, ""); 

  // Parse the cleaned string into a JSON object
    const jsonData = JSON.parse(cleanedString);
    // console.log(result.response.text(),'hi',jsonData);
    res.status(200).json(jsonData);
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error });
    // console.log(error)
  }
};