import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"; //taking with database
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // user.save(); //we are saving after putting the refresh token, but we can't directly save without passing any argument, as many fields are required-true that's why we have to use user.save({validateBeforeSave:false}) instead of user.save()
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch {
    throw new ApiError(
      500,
      "Something went wrong, while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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
  const { fullName, email, username, password } = req.body;
  console.log("email", email);
  //for multiple validation you can use multiple if else block
  // if(fullName===""){
  //     throw new ApiError(400, "fullName is required")
  // }
  //but this is an optimized way of checking
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //using some, we are checking each field(if present), trimming it(if present) and then comparing with "", if any of the field is equal to "", it will return true
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // User.findOne({email})//you can check the first occurrence of email in database, if you need to check multiple fields, you can use below approach

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //this will check if username or email is present or not
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // we get access to the files through this - req.files(provided by multer)
  // req.files.avatar[0] -> File
  // req.files.avatar -> Array
  const avatarLocalPath = req.files?.avatar[0]?.path; // we get a object in avatar[0]
  // const coverImageLocalPath = req.files?.coverImage[0]?.path// we get a object in avatar[0]

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath); //return a response
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar field is required");

  //using ".create" we can upload data to database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // if cover image present then only upload, else left empty(as coverImage is not mandatorily required field)
    email,
    password,
    username: username.toLowerCase(),
  });

  //mongodb automatically create a field "_id" while creating user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //checking the user has been created successfully or not, and removing password and refreshToken field from response

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering user");

  console.log(req.body);
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body se data lao
  //username or email
  //find the user
  //password check
  //wrong password
  //else access token and refresh token
  //send these tokens in the form of cookies(secure cookies)

  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], //find any one username or password and find the first one
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const ispasswordValid = await user.isPasswordCorrect(password); //isPasswordCorrect this method is defined inside user model, as we can access this using the user that we got from findOne method of Mongodb.

  if (!ispasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); //we don't need password and refresh token field, as we gonna send loggedInUser to cookies

  //send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  console.log(loggedInUser);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) //we can access this cookie fied because we write "app.use(cookieParser())" inside app.js
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },

      //if above didn't work, then use below
      // $/unset:{
      //   refreshToken:1//this removed the field from document
      // }
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  const user = await User.findById(decodedToken?._id)
  if(!user){
    throw new ApiError(401, "Invalid refresh Token")
  }

  if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401, "Refresh token is expired or used")
  }

  //now refresh token is matched
  try {
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken : newRefreshToken
        },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
});

const changeCurrentPassword = asyncHandler(async(req, res)=>{
  //if we want to get data from form-data, we have to use multer
  const {oldPassword,newPassword}=req.body
  const user = await User.findById(req.user?._id)
  //console.log(oldPassword, newPassword)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }

  user.password=newPassword
  await user.save({validateBeforeSave : false})
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))

}) 


const getCurrentUser= asyncHandler(async(req, res)=>{
  return res
  .status(200)
  .json(new ApiResponse(
    200, 
    req.user, 
    "Current user fetched successfully"
  ))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
  const {fullName, email}=req.body
  if(!fullName && !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{//aggregation
        fullName:fullName,
        email
        //you can also write "email:email", as both fields are same, we can write only one
      }
    },
    {new : true}//this returns the new updated details
  ).select("-password")//returning without password

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req, res)=>{
  const avatarLocalPath = req.file?.path//while registering the user we use typing "req.files"(because there was multiple files), but now there are only one file(avatar), that's why we are writing "req.file", here
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file missing")
  }

  //delete previous avatar
  const user1=await User.findById(req.user._id)
  //console.log(user1.avatar);
  if (user1.avatar) {
    const publicId = user1.avatar.split('/').pop().split('.')[0]; // Extracting public ID from Cloudinary URL
    await deleteFromCloudinary(publicId);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading the avatar")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Avatar image updated successfully")
  )
})

const updateUserCoverImage=asyncHandler(async(req, res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image file missing")
  }

  //delete previous avatar
  const user1=await User.findById(req.user._id)
  if (user1.coverImage) {
    const publicId = user1.coverImage.split('/').pop().split('.')[0]; // Extracting public ID from Cloudinary URL
    await deleteFromCloudinary(publicId);
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading the Cover image")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover image updated successfully")
  )
})

//this contains the subscriber count, total subscribed channel
const getUserChannelProfile=asyncHandler(async(req, res)=>{
  const {username} =req.params
  //req.params contains route parameters, which are dynamic parts of the URL path that are defined in the route. These parameters are used to capture values from the URL itself.

  console.log("ok")
  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

  //array is returned, so the type of channel is array
  const channel = await User.aggregate([
    //first pipeline(match field pipeline)
    {
      $match:{//we are finding the channel with the given username
        username: username?.toLowerCase()
      }
    },
    //another pipeline
    {
      $lookup:{//lookup field matches
        from: "subscriptions",//here we are not writing "Subscription", because after storing in mongoDB, it converted to lowercase and in plural form
        localField: "_id",//matching "_id" field with "channel" field
        foreignField: "channel",
        as: "subscribers"//and after matching we got he subscribers array of a channel
      }
    },
    //another pipeline
    //to find out the number of channel this username follows/subscribed, we need anther lookup
    {
      $lookup:{
        from: "subscriptions", 
        localField:"_id",
        foreignField:"subscriber",
        as: "subscribedTo"//here were are matching the "_id" with "subscriber", and we got the array of channel to whom the user subscribed
      }
    },
    //another pipeline
    {
      $addFields:{//addFields do add additional field with the existing field of user model
        subscribersCount:{
          $size: "$subscribers"//we are using "$" with subscriber, because not subscriber become a field
          //we got the number of subscriber using the field "$/size" and "subscriber" holds the details of all subscribers of a channel
        },
        channelsSubscribedToCount:{
          $size: "$subscribedTo"//similarly we got the count of subscribed to .
        },
        //isSubscribed checks, whether the logged in user, already subscribed to the channel ot not
        isSubscribed:{
          //we have to find out whether the user is present int he "subscribers" array or not
          $cond:{
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},//we have to find out whether "req.user?._id" is present in "$subscribers.subscriber" or not
            //subscriber field is present in the Subscription schema and from that's where we are getting "$subscribers.subscriber"
            then:true,//if present put true in isSubscribed
            else:false//else put false in isSubscribed
          }
        }
      }
    },
    //another pipeline
    //project gives us projection that we don't wanna provide all values, we will provide the selected values
    {
      $project:{//we have to add "1" beside those fields that we want to pass
        fullName:1,
        username:1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "user channel fetched successfully")//channel[0] contain the field what we want
  )
})

const getWatchHistory=asyncHandler(async(req, res)=>{
  // req.user?._id//we get the mongodb id(String)

  const user=await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },{
      $lookup:{
        from: "videos",//lookup from "Video" schema
        localField: "watchHistory",
        foreignField:"_id",
        as: "watchHistory",
        //nested pipeline
        //now we are inside "Video" schema
        pipeline:[
          {
            $lookup:{
              from: "users",//lookup from "User" schema
              localField:"owner",
              foreignField: "_id",
              as:"owner",
              pipeline:[//we can also use this pipeline outside
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{//we are doing this to easily return the owner field, now we don't have to use owner[0] to get the details, we can directly get the details of owner, as we are passing the first field from here
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetched successfully"
    )
  )
})

export { 
  registerUser, 
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
