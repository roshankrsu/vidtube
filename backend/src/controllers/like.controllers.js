import mongoose from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Either creates or removes a like depending on whether one already exists.
 * The request body should contain exactly one of video, comment or tweet ids.
 */
const toggleLike = asyncHandler(async (req, res) => {
    const { videoId, commentId, tweetId } = req.body

    const payload = {}
    if (videoId) {
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video id")
        }
        payload.video = videoId
    }
    if (commentId) {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid comment id")
        }
        payload.comment = commentId
    }
    if (tweetId) {
        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            throw new ApiError(400, "Invalid tweet id")
        }
        payload.tweet = tweetId
    }

    if (!payload.video && !payload.comment && !payload.tweet) {
        throw new ApiError(400, "One of videoId, commentId or tweetId is required")
    }

    // only one type allowed per request
    const types = [payload.video, payload.comment, payload.tweet].filter(Boolean)
    if (types.length > 1) {
        throw new ApiError(400, "Cannot like more than one resource at a time")
    }

    payload.LikedBy = req.user._id

    const existing = await Like.findOne(payload)
    if (existing) {
        await Like.findByIdAndDelete(existing._id)
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Like removed"))
    }

    const like = await Like.create(payload)
    return res
        .status(201)
        .json(new ApiResponse(201, like, "Liked successfully"))
})

/**
 * Count likes for a given video/comment/tweet.
 * Query parameters mirror the toggleLike body.
 */
const countLikes = asyncHandler(async (req, res) => {
    const { videoId, commentId, tweetId } = req.query
    const filter = {}
    if (videoId) filter.video = videoId
    if (commentId) filter.comment = commentId
    if (tweetId) filter.tweet = tweetId

    if (!filter.video && !filter.comment && !filter.tweet) {
        throw new ApiError(400, "One of videoId, commentId or tweetId is required")
    }

    const count = await Like.countDocuments(filter)
    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "Like count fetched"))
})

export { toggleLike, countLikes }
