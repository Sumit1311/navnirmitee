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
                       subMessage : "Username or Password Invalid"
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
                console.log(error);
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

    sendAjaxResponse(res, response) {
        res.status(response.status).send(JSON.stringify(response.body));
    }

    redirect(req, res, path) {
        if(req.xhr) {
            this.sendAjaxResponse(res, {
                status : 200,
                body : {
                    redirect : path
                },
                code : "OK"

            });
        } else {
            res.redirect(path);
        }
    }
    
    renderErrorPage(req, res, context) {
        if(req.xhr) {
            this.sendAjaxResponse(res, context.errorResponse); 
            return;
        } else {    
            res.status(context.errorResponse.status).render("errorDocument", context);
        }
            

    }
}
