import { Router } from "express"
import { postTweet, getTweets, updateTweet, deleteTweet } from "../controllers/tweet.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

router.route("/")
    .get(getTweets)
    .post(verifyJWT, postTweet)

router.route("/:tweetId")
    .patch(verifyJWT, updateTweet)
    .delete(verifyJWT, deleteTweet)

export default router
