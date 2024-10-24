import mongoose from "mongoose"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {Subscription} from "../models/subscription.model.js"
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params
    const subscriberId = req.user._id;
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"invalid channel id")
    }
    const channel=await User.findById(channelId)
    if(!channel){
        throw new ApiError("Channel fot found")
    }
    const alreadySubscribed=await Subscription.findOne(
        {
            subscriber:subscriberId,
            channel:channelId
        }
    )

    if(alreadySubscribed){
        await alreadySubscribed.deleteOne()
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "unsubscribed successfully"
            )
        )
    }else{
        if(subscriberId!=channelId){
            const subscribed = await Subscription.create({
                subscriber:subscriberId,
                channel:channelId
            })
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subscribed,
                    "subscribed successfully"
                )
            )
        }else{
            throw new ApiError(400, "cant subscribe itself")
        }
        
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    console.log("here")
    const {channelId} = req.params
    console.log(channelId)
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"invalid channel id")
    }
    const channel=await User.findById(channelId)
    if(!channel){
        throw new ApiError("Channel not found")
    }
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails"
            }
        },
        {
            $unwind: {
                path: "$subscriberDetails",
                preserveNullAndEmptyArrays: true // Keep original document even if no subscribers
            } 
        },
        {
            $project:{
                _id: 0, // Optionally hide the subscription ID
                subscriber:1,
                subscriberDetails:1
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "subscriber list of a channel returned"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId)
    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400,"invalid subscriber id")
    }
    const subscriber=await User.findById(subscriberId)
    if(!subscriber){
        throw new ApiError("Subscriber not found")
    }
    const channels=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails"
            }
        },
        {
            $unwind:{
                path:"$channelDetails", // Flatten the array to make each video a separate document
                preserveNullAndEmptyArrays: true // Keep original document even if no subscribers 

            }
        },
        {
            $project:{
                _id: 0, // Optionally hide the subscription ID
                channel:1,
                channelDetails:1
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels returned"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}