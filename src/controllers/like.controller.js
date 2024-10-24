import mongoose from "mongoose";
import {Like} from "../models/like.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike=asyncHandler(async(req, res)=>{
    const {videoId}=req.params;
    const userId=req.user._id
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "video id is invalid")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const existingLike=await Like.findOne({
        video:videoId,
        likedBy:userId
    })
    if(existingLike){
        await existingLike.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Video disliked successfully"
            )
        )
    }else{
        const newLike=await Like.create({
            video:videoId,
            likedBy:userId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                "Video liked successfully"
            )
        )
    }
})
const toggleCommentLike=asyncHandler(async(req, res)=>{
    const {commentId}=req.params;
    const userId=req.user._id
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Comment id is invalid")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "comment not found");
    }

    const existingLike=await Like.findOne({
        comment:commentId,
        likedBy:userId
    })
    if(existingLike){
        await existingLike.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment disliked successfully"
            )
        )
    }else{
        const newLike=await Like.create({
            comment:commentId,
            likedBy:userId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                "Comment liked successfully"
            )
        )
    }
})
const toggleTweetLike=asyncHandler(async(req, res)=>{
    const {tweetId}=req.params;
    const userId=req.user._id
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "Tweet id is invalid")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found");
    }

    const existingLike=await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })
    if(existingLike){
        await existingLike.deleteOne();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Tweet disliked successfully"
            )
        )
    }else{
        const newLike=await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                "Tweet liked successfully"
            )
        )
    }
})


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId=req.user._id;

    const likes=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $unwind: "$videos" // Flatten the array to make each video a separate document
        },
        {
            $project: {
                _id: 0, // Hide the Like _id itself
                video: "$videos" // Only return the video details
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likes.map(like => like.video), // Send the video data only
                "All liked videos fetched successfully"
            )
        );
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
