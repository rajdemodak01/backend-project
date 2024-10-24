import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

//app.use is used for middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
//to get the data when form is submitted
app.use(express.urlencoded({extended:true, limit:"16kb"}))
//we write extended:"true" to use object inside object
//we use this urlencoded to get data from url8
app.use(express.static("public"))
//sometime we want to store file/folder, which we make public asset
app.use(cookieParser())//this is used to do crud operation on cookies



//routes import 
import userRouter from './routes/user.route.js'
import videoRouter from "./routes/video.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import healthcheckRouter from "./routes/healthcheck.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import playlistRouter from "./routes/playlist.route.js"

//routes declaration
//yeha pe hum log app.get() likh rehe the aur humlogo ka kaam ho raha tha, kyuki, yehi humlog routes likh rehe the aur yehi pe controller likh rehe the, but now chize separated hai, ab router ko lane k liye middleware lana hoga(compulsory hai)(so we will use app.use() instead of app.get())

app.use("/api/v1/users", userRouter)//jab bhi koi "/api/v1/users" url hit karega humlog control de denge userRouter ko(ab baki kaam userRouter karega)
// as we are using api, it is good practice to use "/api/v1/users" instead of simple "/users" 
// (v1 means version 1)

//http://localhost:8000/api/v1/users/register

app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/playlist", playlistRouter)

export {app}
//you can also export this using default