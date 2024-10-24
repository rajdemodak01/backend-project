import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const publishVideo=asyncHandler(async(req, res)=>{
    const {title, description}=req.body
    if(!title){
        throw new ApiError(400, "Title is required")
    }
    const videoLocalPath = req.files?.video[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    const video=await uploadOnCloudinary(videoLocalPath)
    let thumbnailLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0
        ) {
        thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "Error while uploading the thumbnail on cloudinary")
    }

    if(!video){
        throw new ApiError(400, "Error while uploading the video on cloudinary")
    }
    const newVideo=await Video.create({
        title, 
        description, 
        videoFile:video?.url,
        thumbnail: thumbnail?.url || "",
        duration:video.duration,
        owner:req.user._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            newVideo, 
            "Video uploaded successfully"
        )
    )
})

const getAllVideos=asyncHandler(async(req, res)=>{
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const videos = await Video.find();

    // Return the videos as a response
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const video=await Video.findById(videoId)
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video found successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description}=req.body
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "invalid video id")
    }
    let video=await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    let thumbnail;
    const thumbnailLocalPath = req.file?.path
    if(thumbnailLocalPath){
        if(video.thumbnail){
            const publicId = video.thumbnail.split('/').pop().split('.')[0]; // Extracting public ID from Cloudinary URL
            await deleteFromCloudinary(publicId);
        }
        thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
        if(!thumbnail.url){
            throw new ApiError(400, "Error while uploading the thumbnail")
          }
    }

    video=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title || video.title, // Update title only if provided
                description: description || video.description, // Update description only if provided
                thumbnail: thumbnail?.url || video.thumbnail
            }
        },
        {new:true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video, 
            "video details updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail.split('/').pop().split('.')[0]);
        console.log("deleted Successfully")
    }
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile.split('/').pop().split('.')[0], "video");
        console.log("deleted Successfully")
    }
    await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError("Invalid video id")
    }
    let video=await Video.findById(videoId)
    if(!video){
        throw new ApiError("Video don't exist")
    }
    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "toggle updated"
        )
    )
})

export {
    publishVideo, 
    getAllVideos, 
    getVideoById, 
    updateVideo, 
    deleteVideo, 
    togglePublishStatus
}