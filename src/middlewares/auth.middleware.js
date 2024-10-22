//this middleware will verify is user present or not
//we will verify on the basis of whether token present or not 
//we will add a new object inside the req(like req.body)

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT  = asyncHandler(async(req, _, next)=>{// when we have no use of "res" we can write "_"(underscore) in place of "res"//production grade code approach 
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")//user can also send bearer token, user will send with syntax "Bearer <token>", then we will replace "Bearer <token>" with "<token>"
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {   
            //discuss about frontend
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
        next()
    }catch(error){
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
    
})