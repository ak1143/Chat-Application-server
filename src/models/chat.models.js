import { Schema,model } from "mongoose";

const chatSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    
});

export const Chat = model("Chat",chatSchema) 