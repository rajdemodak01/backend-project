//require('dotenv').config({path:'./env'})
//As early as possible in your application, import and configure dotenv
//above is one approach, but as it affect our consistency of our code, we use the below appraoch(by importing dotenv)
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path:'./.env'//we give the path of the .env file here
})
//to use this approach, we have to write ""dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"" this inside the package.json under Scripts


//as connectDB is a async function, it will return a promise(so we can use .then or .catch)
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB db connection failed || ", err)
})






















//thi is one way to connect to database
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";

const app=express()

(async ()=>{
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERR: ", error)
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening to port ${process.env.PORT}`) 
        })
    }catch(error){
        console.log("ERROR", error);
        throw err
    }
})()*/
//(()=>{})() this syntax is used to excute the function along with declaration
