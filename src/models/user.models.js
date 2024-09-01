import { Schema,model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required: true,
        unique:true
    },
    password:{
        type:String,
        required: true,
        select: false
    },
    avatar:{
        public_id:{
            type:String,
            required: true
        },
        url:{
            type:String,
            required:true
        }
    }
},{ timestamps:true }
);


// pre method is introduced because the password needes to be hased before
// it stored in a db.

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    try {
        this.password = await bcrypt.hash(this.password,10);
        next();
    } catch (error) {
        console.log("error occured at hashing the password")
    }
});

// Access Token method:-

const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite : "none",
    httpOnly : true,
    secure : true
}

userSchema.methods.sendToken = function(res, user, code, message){
    const token = jwt.sign( {_id: user._id}, process.env.JWT_ACCESSTOKEN);
    return res.status(code).cookie("chat",token,cookieOptions).json({
        success:true,
        message,
        token
    });
}

export { cookieOptions }

export const User = model("User",userSchema)