/*that file is used to wrap asynchronous route handler functions in Express.js. This pattern simplifies error handling by catching errors in asynchronous functions and forwarding them to a centralized error handler. */
//this is one approach using promise

//higher order function, accept a function and also return a function
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))//we are executing the function passed here
        .catch((err) => next(err))
    }
}

export {asyncHandler}



// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}
//in this way we are using async and using try-catch
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);//we are executing the function which is passed
//     } catch (error) {
//         // Sending a response with the error code and a JSON response with success: false
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };
