import { Router } from "express"
import {
    uploadVideo,
    getVideo,
    getAllVideos,
    updateVideo,
    deleteVideo
} from "../controllers/video.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"

const router = Router()

// public list and single
router.route("/").get(getAllVideos)
router.route("/:videoId").get(getVideo)

// secured endpoints
router.use(verifyJWT)
router
    .route("/")
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        uploadVideo
    )
router
    .route("/:videoId")
    .patch(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        updateVideo
    )
    .delete(deleteVideo)

export default router
