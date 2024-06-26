import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from '../model/user.model.js'

export const verifyJwt = asyncHandler(async( req , res, next)=>{
    try {
        console.log(req.body.headers.Authorization)
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer " , "") ||  req.body.headers?.Authorization?.replace("Bearer " , "") || req.body.accessToken;
    
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);

        // console.log(decodedToken);
    
        const  user = await User.findById(decodedToken).select("-password -refreshToken");

        // console.log(user)
    
        if(!user){
            throw new ApiError(401, "Invalid token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

})