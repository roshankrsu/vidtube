import { Router } from "express"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
} from "../controllers/playlist.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist).get(getUserPlaylists)
router
    .route("/:playlistId")
    .get(getPlaylist)
    .patch(updatePlaylist)
    .delete(deletePlaylist)

router.route("/:playlistId/videos").post(addVideoToPlaylist).delete(removeVideoFromPlaylist)

export default router
