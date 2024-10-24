import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, toggleSubscription, getUserChannelSubscribers } from "../controllers/subscription.controller.js";

const router=Router()

router.use(verifyJWT)

router
    .route("/c/:channelId")
    .post(toggleSubscription) // Toggle the subscription for the channel
    .get(getUserChannelSubscribers); // Get subscribers of a specific channel

router.route("/u/:subscriberId").get(getSubscribedChannels); // Get all subscribed channels for a user

export default router