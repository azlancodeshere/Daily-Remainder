import express from "express"
import "dotenv/config";
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./db/db";
import { connect } from "mongoose";

const app = express()


app.use(
    cors({
        origin:"http://localhost:5173/",
        credentials:true
    })
)


app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

 connectDB()



app.listen(PORT, () => {
  console.log(`LifeOS server running on port ${PORT}`);
});