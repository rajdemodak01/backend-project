import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "./ApiError.js";


//we got this from cloudinary docs
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null//if file not present direct return null

        //upload the file into cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"//we can define here the type of the file//whether image or video or any other file
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url)//response.url will give the url after uploading to cloudinary
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload operation got failed
        return response
    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteFromCloudinary = async(localFilePath)=>{
    if(!localFilePath){
        console.log("nothing to delete")
        return
    }
    try {
        const result = await cloudinary.uploader.destroy(localFilePath, { resource_type: 'image' });
        console.log('File deleted successfully:', result);
      } catch (error) {
        console.log('Error deleting the file:', error);
        throw new ApiError(400, "Error while deleting the avatar");
      }    
}

export {uploadOnCloudinary, deleteFromCloudinary}