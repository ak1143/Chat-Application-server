import express from "express"
import { connectDB } from "./src/db/index.js";
import dotenv from 'dotenv'
import { errorMiddleware } from "./src/middlewares/error.js";
import cookieParser from "cookie-parser";
import userRouter from "./src/routes/user.routes.js"
import chatRouter from "./src/routes/chat.routes.js"
import { crateUser } from "./src/seeders/user.seeders.js";
import { createGroupChats, createMessagesInAChat, createSingleChats } from "./src/seeders/chat.seeders.js";

dotenv.config({
    path:"./.env"
})

const app = express();

connectDB(process.env.MONGODB_URI)

// seeders: to create a dummy data
// crateUser(10)
// createSingleChats(10);
// createGroupChats(10)
// createMessagesInAChat("66d6e1981dd2d8e26f0ab332",50)

// middlewares: without middlewares you can destructure.
app.use(express.json());
app.use(express.urlencoded()); // form data
app.use(cookieParser())


// routes setup
app.use("/user",userRouter)
app.use("/chat",chatRouter)

app.get("/",(req,res)=>{
    res.send("Hello there")
});

app.use(errorMiddleware)

app.listen(process.env.PORT || 3000,()=>{
    console.log(`server is running on ${process.env.PORT}`)
})

export { app }