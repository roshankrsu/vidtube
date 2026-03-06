import { Router } from "express"
import { toggleSubscription, getMySubscriptions, getChannelSubscribers } from "../controllers/subscription.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

// all of these routes are protected
router.use(verifyJWT)

router.post("/:channelId", toggleSubscription)
router.get("/mine", getMySubscriptions)
router.get("/channel/:channelId", getChannelSubscribers)

export default router
