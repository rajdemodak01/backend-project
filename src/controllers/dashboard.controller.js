import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"


const getTotalLikes = async (model, field, channelId) => {
    const results = await model.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: field,
                as: "likesOnItems"
            }
        },
        {
            $addFields: {
                totalLikesOnItem: { $size: "$likesOnItems" }
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: "$totalLikesOnItem" }
            }
        }
    ]);
    
    return results.length > 0 ? results[0].totalLikes : 0;
};



const getChannelStats = asyncHandler(async (req, res) => {
    /* TODO: Get the channel stats like total video views(done), total subscribers(done), total videos(done), total likes etc.*/
    const channelId=req.user._id
    const videos=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channelId)
            }
        },
    ])
    
    const totalVideoViews = videos
    .map(video => video.views)
    .reduce((acc, curr) => acc + curr, 0);
    const totalVideos=videos.length
    
    const totalSubscribersResult =await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalSubscribers" // This will return a document with the total number of subscribers
            //Ensure that the response format is consistent. If totalSubscribers is an array (due to the aggregation), you'll need to check its length and return the count accordingly.
        }
    ])
    
    const totalSubscribers = totalSubscribersResult.length > 0 ? totalSubscribersResult[0].totalSubscribers : 0;
    
    // Usage in getChannelStats
    const totalLikesOnVideos = await getTotalLikes(Video, "video", channelId);
    const totalLikesOnComments = await getTotalLikes(Comment, "comment", channelId);
    const totalLikesOnTweets = await getTotalLikes(Tweet, "tweet", channelId);
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                "totalSubscriberCount":totalSubscribers, 
                "totalVideoViews":totalVideoViews, 
                "totalVideos":totalVideos, 
                "likes":{
                    "totalLikesOnVideos":totalLikesOnVideos,
                    "totalLikesOnComments":totalLikesOnComments,
                    "totalLikesOnTweets":totalLikesOnTweets
                }
            },
            "All data fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId=req.user._id;
    const videos=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channelId)
            }
        },
    ])

    if (videos.length === 0) {
        return res
            .status(404)
            .json(
                new ApiResponse(404, null, "No videos found for this channel")
            );
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "all video of this channel fetched successfully"
        )
    )
})

export {
    getChannelStats,
    getChannelVideos
}