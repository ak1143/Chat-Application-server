import { TryCatch } from "../middlewares/error.js";
import { cookieOptions, User } from "../models/user.models.js"
import bcrypt from 'bcrypt'
import { Errorhandler } from "../utils/ErrorHandler.js";

// to generate the user accessToken and refereshToken.

// const generateAccessAndRefereshToken = async(userId) =>{
//     try {
//         const user = await User.findOne(userId);
//         const token = user.sendToken();
//         return { token }
//     } catch (error) {
//         console.log("error at generating access and referesh token",error);
//     }
// }


// create a new user and save it to database and save in cookie

const registerUser = async (req,res) =>{
    
    const { name, username, password, bio } = req.body;

    // console.log(req.body);
    const avatar = {
        public_id :"asd",
        url : "asdasf",
    }

    const user = await User.create({
        name,
        username,
        bio,
        avatar,
        password
    })

    user.sendToken(res, user, 201, "User created successfully");
}

const login = TryCatch(async(req, res,next) => {
    const { username, password } = req.body;

    if (!username || username.length === 0) {
        return res.status(400).json({ message: "Please enter a username" });
    }

    if (!password || password.length === 0) {
        return res.status(400).json({ message: "Please enter a password" });
    }

    // Find the user and include the password field
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
        return next(new Errorhandler ("Invalid username or password",400));
    }
    // Check if the password is valid
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        return next(new Errorhandler ("Invalid username or password",400))
    }
    
    user.sendToken(res, user, 201, "User logged in successfully");
});

const getMyProfile = TryCatch(async (req,res) =>{

    const user = await User.findById(req.user)
    console.log(user)
    res.status(200).json({
        success: true,
        user
    })
});

const logout = TryCatch( async(req,res,next)=>{
    return res
        .status(200)
        .cookie("chat","",{...cookieOptions , maxAge : 0})
        .json({
            success : true,
            message :"logged out successfully."
        })
});

const searchUser = TryCatch (async(req,res,next)=>{
    const { name } = req.query;

    // later

});


export {
    registerUser,
    login,
    getMyProfile,
    logout,
    searchUser
}