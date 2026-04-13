import mongoose from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const postTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet posted"))
})

const getTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    const pipeline = [
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        {
            $addFields: { owner: { $first: "$owner" } }
        }
    ]

    const options = { page: Number(page), limit: Number(limit) }
    const tweets = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), options)
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this tweet")
    }

    if (content && content.trim() !== "") {
        tweet.content = content
        await tweet.save()
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted"))
})

export { postTweet, getTweets, updateTweet, deleteTweet }
