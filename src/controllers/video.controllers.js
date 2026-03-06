import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

/**
 * Upload a new video along with its thumbnail. User must be authenticated.
 */
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description, duration } = req.body

    if (!title || !description || !duration) {
        throw new ApiError(400, "Title, description and duration are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    // upload video
    const videoUpload = await uploadOnCloudinary(videoFileLocalPath)
    if (!videoUpload) {
        throw new ApiError(500, "Failed to upload video to cloudinary")
    }

    // upload thumbnail
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnailUpload) {
        // cleanup video we already uploaded
        await deleteFromCloudinary(videoUpload.public_id)
        throw new ApiError(500, "Failed to upload thumbnail to cloudinary")
    }

    const newVideo = await Video.create({
        title,
        description,
        duration: Number(duration),
        videoFile: videoUpload.secure_url,
        thumbnail: thumbnailUpload.secure_url,
        views: 0,
        owner: req.user._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, newVideo, "Video uploaded successfully"))
})

/**
 * Get a single video by id. This will increment the view counter and add the
 * video to the current user's watch history if they're authenticated.
 */
const getVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId).populate("owner", "username avatar")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // increment views
    video.views += 1
    await video.save({ validateBeforeSave: false })

    // if user is logged in, push to history
    if (req.user) {
        try {
            const user = await User.findById(req.user._id)
            if (user && !user.watchHistory.includes(video._id)) {
                user.watchHistory.push(video._id)
                await user.save({ validateBeforeSave: false })
            }
        } catch (err) {
            console.warn("Failed to update watch history", err)
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

/**
 * List videos with optional search / owner filter and pagination.
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "", owner } = req.query

    const pipeline = []

    if (search && search.trim() !== "") {
        pipeline.push({
            $match: {
                title: { $regex: search, $options: "i" }
            }
        })
    }

    if (owner && mongoose.Types.ObjectId.isValid(owner)) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(owner)
            }
        })
    }

    pipeline.push(
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
        },
        {
            $sort: { createdAt: -1 }
        }
    )

    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options)
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

/**
 * Update a video. Only the owner can update. Allows changing metadata and
 * optionally re-uploading the video file / thumbnail.
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this video")
    }

    const { title, description, duration, isPublished } = req.body
    if (title) video.title = title
    if (description) video.description = description
    if (typeof isPublished !== "undefined") video.isPublished = isPublished
    if (duration) video.duration = Number(duration)

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (videoFileLocalPath) {
        const uploaded = await uploadOnCloudinary(videoFileLocalPath)
        if (uploaded) video.videoFile = uploaded.secure_url
    }

    if (thumbnailLocalPath) {
        const uploaded = await uploadOnCloudinary(thumbnailLocalPath)
        if (uploaded) video.thumbnail = uploaded.secure_url
    }

    await video.save()
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"))
})

/**
 * Delete a video. Only owner may delete.
 */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this video")
    }

    await Video.findByIdAndDelete(videoId)
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

export {
    uploadVideo,
    getVideo,
    getAllVideos,
    updateVideo,
    deleteVideo
}
