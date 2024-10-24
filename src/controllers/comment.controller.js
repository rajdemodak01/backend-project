// import mongoose, {Types, ObjectId} from "mongoose";
import mongoose, { Types } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js"

const addComment=asyncHandler(async(req, res)=>{
    const {content}=req.body
    const {videoId} = req.params
    if(!(content && videoId)){
        throw new ApiError(400, "Content and video ID are required")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const videoExists=await Video.findById(videoId)
    if(!videoExists){
        throw new ApiError(400, "Video not found")
    }
    const newComment=await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, newComment, "Comment added Successfully")
    )
})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Convert limit and page to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Ensure valid limit and page numbers
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid page or limit"));
    }

    // Aggregate to get comments
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new Types.ObjectId(videoId), // Ensure videoId is a valid ObjectId
            },
        },
        {
            $lookup: {
                from: "users", // Ensure this matches your users collection name
                localField: "owner",
                foreignField: "_id",
                as: "OwnerDetails",
            },
        },
        {
            $addFields: {
                ownerDetails: { $arrayElemAt: ["$OwnerDetails", 0] }, // Get the first element from the OwnerDetails array
            },
        },
        {
            $project: {
                content: 1,
                owner: 1,
                //"ownerDetails.fullName": 1, // Only return the necessary fields
                //"ownerDetails.avatar": 1,
                ownerDetails: 1,
            },
        },
        {
            $skip: (pageNum - 1) * limitNum, // Skip documents for pagination
        },
        {
            $limit: limitNum, // Limit the number of documents returned
        },
    ]);

    // If no comments are found
    if (comments.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No comments found for this video"));
    }

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment= asyncHandler(async(req, res)=>{
    const {content}=req.body
    const {commentId}=req.params
    if (!content) {
        throw new ApiError(400, "Content is required for updating the comment");
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },
        {new:true}
    )

    if(!updatedComment){
        throw new ApiError(404, "Comment not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            updatedComment,
            "comment updated"
        )
    )
})

const deleteComment =asyncHandler(async(req, res)=>{
    const {commentId}=req.params
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const deletedComment=await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            deletedComment,
            "comment deleted successfully"
        )
    )
})

export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment 
}