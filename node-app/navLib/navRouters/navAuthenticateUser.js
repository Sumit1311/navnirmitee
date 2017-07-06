var navPassportInitializer = require(process.cwd() + '/lib/navPassportInitializer.js'),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js");

module.exports = class navAuthenticateUser {
    authenticate(req, res) {
        req.assert("email","Email is Required").notEmpty();
        req.assert("email","Valid Email Required").isEmail();
        req.assert("password","Password is Required").notEmpty();
        req.assert("password","Valid Password Required").isValidPassword();
        var validationErrors = req.validationErrors();
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        navPassportInitializer.authenticate(req, res, null, deferred);        
    }
}
