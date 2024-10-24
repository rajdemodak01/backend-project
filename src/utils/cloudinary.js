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
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    if (!publicId) {
        console.log("Nothing to delete, publicId is undefined or null");
        return;
    }

    try {
        console.log('Attempting to delete Cloudinary file with publicId:', publicId);  // Add logging for publicId
        
        // Delete the resource from Cloudinary using the public ID
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        if (result.result === 'not found') {
            console.log(`File with publicId ${publicId} not found in Cloudinary`);
            return result;  // Not an error, just file not found
        }

        console.log('File deleted successfully:', result);
        return result;
    } catch (error) {
        console.error('Error deleting the file from Cloudinary:', error);  // Log full error details for debugging
        throw new ApiError(500, `Error while deleting the file from Cloudinary: ${error.message}`);  // Include error message in ApiError
    }
};

export {uploadOnCloudinary, deleteFromCloudinary}