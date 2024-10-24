import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addComment, getVideoComments, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router=Router()

router.use(verifyJWT)// Apply verifyJWT middleware to all routes in this file

// router.route("/:videoId").get(getVideoComments).post(addComment)
router.route("/:videoId").get(getVideoComments).post(addComment)
//you will get the videoId from mongodb
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
// router.route("/c/:commentId").patch(updateComment);

export default router