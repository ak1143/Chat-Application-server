import Jwt from "jsonwebtoken";
import { Errorhandler } from "../utils/ErrorHandler.js";

const isAuthenticated = (req,res,next) =>{
    const token = req.cookies["chat"]

    if(!token) return next(new Errorhandler("please login to access this page",401));

    const decodeData = Jwt.verify(token,process.env.JWT_ACCESSTOKEN);
    // console.log(decodeData);

    req.user = decodeData._id;

    next();
};

export { isAuthenticated }