import   'dotenv/config';
import {app} from './app.js'
import connectDB from "./db/index.js";
// dotenv.config()

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server started at port ${process.env.PORT || 8000}`)
    }) 
})
.catch((err)=>{
    console.log("Mongodb connection failed :: " , err)
})