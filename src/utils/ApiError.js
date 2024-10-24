//we will handle api error in this way, that's why this file is created
//we are creating a child class of class Error(which we get from node)
class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack="",//errorStack
    ){
        super(message)
        //overwriting
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors=errors
        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}