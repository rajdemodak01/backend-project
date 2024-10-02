import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema(
    {
        username:{
            type:String, 
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String, 
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String, 
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,//cloudinary url
            required:true
        },
        coverImage:{
            type:String,//cloudinary url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String, 
            required:[true, "Password field is required"]
        },
        refreshToken:{
            type:String
        }
    },{timestamps:true}
)

userSchema.pre("save", async function (next){//before saving the datas, run this function
    if(!this.isModified("password")) return next();//we want to encrypt the password whenever we create/change the password
    this.password=await bcrypt.hash(this.password, 10)//10 means 10 rounds, //encrypt the password
    next()
})

//we can also create custom methods using userSchema.methods
//below is the example
userSchema.methods.isPasswordCorrect=async function(){
    return await bcrypt.compare(password, this.password)
}


//JWT is a bearer token(like a key). Whoever have this JWT, we will send data to them only
//this methods generate access token
userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,//we will get this from mongodb
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


//this methods generate refresh token
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,//we don't need multiple things here, we can only pass id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User", userSchema)//this can directly contact with mongoose
