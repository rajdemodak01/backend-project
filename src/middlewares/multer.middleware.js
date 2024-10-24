import multer from "multer";

//you can view this from npm website
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")//we are storing the file in "/public/temp" folder temporarily
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)//we are saving with the original name of the file
    }
    //it return the local file path
  })
  
export const upload = multer({ 
    storage, 
})