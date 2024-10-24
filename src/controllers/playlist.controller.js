import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body
    const userId=req.user._id;

    const playlist=await Playlist.create({
        name,
        description,
        owner:userId
    })
    if(!playlist){
        throw new ApiError(400, "Error while creating playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist, 
            "playlist created for this user successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if (playlists.length === 0) {
        return res.status(404).json(
            new ApiResponse(
                404,
                null,
                "No playlists found for this user"
            )
        );
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "all playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    //TODO: get playlist by id
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist don't exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist found successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // Use $addToSet to avoid duplicates
        { new: true } // Return the updated document
    );


    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video added to playlist successfully"
        )
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } }, // Use $addToSet to avoid duplicates
        { new: true } // Return the updated document
    );


    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video removed from playlist successfully"
        )
    );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    // TODO: delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)


    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if(!name){
        throw new ApiError(400, "Name of the playlist is mandatory")
    }

    const previousPlaylist=await Playlist.findById(playlistId);
    if(!previousPlaylist){
        throw new ApiError(400, "playlist don't exist")
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description: description || previousPlaylist?.description
            }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}