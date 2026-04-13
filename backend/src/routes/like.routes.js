import { Router } from "express"
import { toggleLike, countLikes } from "../controllers/like.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

router.use(verifyJWT)

// create / remove like
router.post("/", toggleLike)
// fetch count
router.get("/count", countLikes)

export default router
