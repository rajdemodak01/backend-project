import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

//creating route
router.route("/register").post(
    upload.fields([//here we are using middleware(register k pass jane se pehle, mere se ekbar mil k jana)
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)//we are handling post request here
//post registerUser at the url "//http://localhost:8000/api/v1/users/register"

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, upload.none(), updateAccountDetails)//if we write "post" then all details will be updated//if we are sending any data then, we use "post"//we are writing upload.none(), this will access form-data(to accept form-data we need to use multer, and upload function is from multer)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar)//we are sending only one image/file, that's why we are writing "upload.single()"
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router