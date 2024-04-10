import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'
const app = express()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials:true
}))

app.use(express.json())
app.use(express.urlencoded());
app.use(express.static("public"))
app.use(cookieParser());

//routes import 
import userRoutes from './routes/user.routes.js'
app.use("/api/v1/user" , userRoutes);


export {app} 