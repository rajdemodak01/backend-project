import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId=req.user._id;
    const {content}=req.body
    //console.log(content)

    const tweet=await Tweet.create(
        {
            content,
            owner:userId
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "new tweet added successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId=req.user._id;
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
              from: 'likes', // The 'Like' collection
              localField: '_id', // Tweet ID in the Tweet collection
              foreignField: 'tweet', // The 'tweet' field in the Like collection
              as: 'likes', // This will store an array of likes for each tweet
            },
        },
        {
            $addFields: {
              likesCount: { $size: '$likes' }, // Count the number of likes for each tweet
            },
        },
        {
            $project: {
              content: 1,
              createdAt: 1,
              updatedAt: 1,
              likesCount: 1, // Only return necessary fields
            },
        },
    ])

    if (tweets.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No tweets found for this user"));
    }    

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "all tweets by this user fetched"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const userId = req.user._id;
    const {content}=req.body
    const {tweetId}=req.params
    if (!content) {
        throw new ApiError(400, "tweet is required for updating the tweet");
    }
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweet=await Tweet.findById(tweetId)

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    //you can also do
    /*
        tweet.content = content;
        await tweet.save(); 
    */
    const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {new:true}
    )

    if(!updatedTweet){
        throw new ApiError(404, "tweet not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId=req.user._id;
    const {tweetId}=req.params

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    let tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "tweet doesn't exist")
    }
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    const deletedTweet=await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedTweet, 
            "tweet deleted successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}