import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"//taking with database
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser=asyncHandler( async (req, res) =>{
    // res.status(200).json({//sending json response
    //     message: "ok"
    // })
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, check avatar correctly uploaded or not
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation (response arrive or not)
    // return response


    //we got data from frontend in req.body(provided by express)
    //req.body contain the text fields
    const {fullName, email, username, password} = req.body
    console.log("email", email)

    //for multiple validation you can use multiple if else block
    // if(fullName===""){
    //     throw new ApiError(400, "fullname is required")
    // }


    //but this is an optimized way of checking
    if(
        [fullName, email, username, password].some((field)=> field?.trim()==="")//using some, we are checking each field(if present), triming it(if present) and then comparing with "", if any of the field is equal to "", it will return true
    ){
        throw new ApiError(400, "All fields are required")
    }

    // User.findOne({email})//you can check the first occurance of email in databse, if you need to check multiple fields, you can use below approach

    const existeduser=await User.findOne({
        $or : [{username}, {email}] //this will check if username or email is present or not
    })

    if(existeduser){
        throw new ApiError(409, "User with email or username already exist")
    }


    // we get access to the files through this - req.files(provided by multer)
    // req.files.avatar[0] -> File
    // req.files.avatar -> Array
    const avatarLocalPath = req.files?.avatar[0]?.path// we get a object in avatar[0]
    // const coverImageLocalPath = req.files?.coverImage[0]?.path// we get a object in avatar[0]
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required")
    
    const avatar=await uploadOnCloudinary(avatarLocalPath)//return a response
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar) throw new ApiError(400, "Avatar field is required")
    
    
    //using ".create" we can upload data to database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",// if cover image present then only upload, else left empty(as coverImage is not mandatarily required field)
        email, 
        password,
        username: username.toLowerCase()
    })
    
    //mongodb authomatically create a field "_id" while creating user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        )//checking the user has been created successfully or not, and removing password and refreshToken field from response
        
        if(!createdUser) throw new ApiError(500, "Something went wrong while registering user")
        
        console.log(req.body);
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
            )
})

export {registerUser}