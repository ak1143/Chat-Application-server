import { Schema,model } from "mongoose";

const messageSchema = new Schema({
    content: String,
    attachments : [
        {
            public_id : {
                type : String,
                required : true
            },
            url :{
                type : String ,
                required : true,
            },
        }
    ],
    sender : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    chat : {
        type : Schema.Types.ObjectId,
        ref : "Chat"
    }
}, { timestamps : true });

export const Message = model("Message",messageSchema);