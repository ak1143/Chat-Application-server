import mongoose from "mongoose";

const connectDB = (uri) =>{
    mongoose.connect(uri, { dbName : "Chat-app"})
    .then((data)=>{
        console.log(`Connected to DB :${data.connection.host}`);
    })
    .catch((error)=>{
        throw error;
    });
}

export { connectDB }