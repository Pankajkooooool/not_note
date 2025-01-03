import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";
/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
// app.use(cors());
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
app.options("*", cors());

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/note",noteRoutes)

/* MONGOOSE SETUP */
const PORT = process.env.PORT || '3000';
const MONGO_URL = process.env.MONGO_URL as string;

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions)
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
}).catch((err)=>{
  console.log("Error occoured",err)
})
