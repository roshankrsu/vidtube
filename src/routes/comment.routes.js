import { Router } from "express"
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

router.route("/video/:videoId").get(getVideoComments)

// operations that require authentication
router.post("/video/:videoId", verifyJWT, addComment)
router.patch("/:commentId", verifyJWT, updateComment)
router.delete("/:commentId", verifyJWT, deleteComment)

export default router
