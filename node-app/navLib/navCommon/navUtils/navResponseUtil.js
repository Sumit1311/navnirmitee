module.exports = class navResponseUtils {
    generateErrorResponse(error) {
        switch(error.name){
            case "navDatabaseException" :
                return this.generateResponse(error.code, {
                    message : "Internal Server Error", 
                       subMessage: error.message
                }, error.status);
            case "navValidationException" :
                return this.generateResponse(error.code,{
                    message : "Bad Request",
                       subMessage : error.message
                }, error.status);
            case "navUserNotFoundException" :
                return this.generateResponse(error.code,{
                    message : "Bad Request",
                       subMessage : "Username or Password not matched"
                }, error.status);
            case "navLoginFailureException" :
                return this.generateResponse(error.code,{
                    message : "Bad Request",
                       subMessage : "Username or Password not matched"
                }, error.status);
            case "navValidationException" :
                return this.generateResponse(error.code,{
                    message : "Bad Request",
                       subMessage : "Validation Errors",
                       validationErrors : error.errorList
                }, error.status);
            case "navSendEmailException" :
                return this.generateResponse(error.code,{
                    message : "Internal Server Error",
                       subMessage : "Email not sent",
                }, error.status);
            case "navUserExistsException" :
                return this.generateResponse(error.code,{
                    message : "Bad Request",
                       subMessage : "User already present",
                }, error.status);
            case "LogicalException" :
                return this.generateResponse("INPUT_ERROR",{
                    message : "Bad Request",
                       subMessage : "",
                }, 400);
            default :
                return this.generateResponse("UNKNOWN", {
                    message : "Internal Server Error",
                       subMessage : "Something Went Wrong, Please try again"
                }, 500)
        }

    }

    generateResponse(code, body, status) {
        return {
            code : code,
            body : body,
            status : status
        }
}

}
