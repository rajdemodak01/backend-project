import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //mongoose return a object(the responses) which we can store in a variable
        console.log(`\n Mongodb connected !! DB Host: ${connectionInstance.connection.host} `)
    }catch(error){
        console.log("MONGODB connection error ", error);
        process.exit(1)//this means we are exiting this process with exit code 1//there are multiple exit codes, give it a read
    }
}
export default connectDB