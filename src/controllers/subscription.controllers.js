import mongoose from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Subscribe or unsubscribe the current user to a channel.
 * If an existing subscription is found it's removed (unsubscribed), otherwise
 * a new one is created.
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    if (req.user._id.toString() === channelId) {
        throw new ApiError(400, "Cannot subscribe to yourself")
    }

    const existing = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existing) {
        await Subscription.findByIdAndDelete(existing._id)
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"))
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    return res
        .status(201)
        .json(new ApiResponse(201, subscription, "Subscribed successfully"))
})

/**
 * Get channels the current user has subscribed to.
 */
const getMySubscriptions = asyncHandler(async (req, res) => {
    const subs = await Subscription.find({ subscriber: req.user._id }).populate(
        "channel",
        "username avatar fullName"
    )
    return res
        .status(200)
        .json(new ApiResponse(200, subs, "My subscriptions fetched"))
})

/**
 * Get subscribers for a particular channel.
 */
const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const subs = await Subscription.find({ channel: channelId }).populate(
        "subscriber",
        "username avatar fullName"
    )
    return res
        .status(200)
        .json(new ApiResponse(200, subs, "Subscribers fetched"))
})

export { toggleSubscription, getMySubscriptions, getChannelSubscribers }
