import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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

export default router