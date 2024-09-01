import { Schema,model } from "mongoose";

const chatSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    groupChat : {
        type : Boolean,
        default : false 
    },
    creator :{
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    members : [
        {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    ]
},{timestamps : true});

export const Chat = model("Chat",chatSchema) 