var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    Q = require('q'),
    moment = require('moment'),
    navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    navValidationException = require(process.cwd() + '/lib/exceptions/navValidationException.js'),
    navUserExistsException = require(process.cwd() + "/lib/exceptions/navUserExistsException.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navEmailVerification= require(process.cwd() + "/lib/navEmailVerification.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navPasswordUtil = require(process.cwd() + "/lib/navPasswordUtil.js"),
    navUserDAO= require(process.cwd() + '/lib/dao/user/userDAO.js');

module.exports = class navRegistration extends navBaseRouter {
    constructor() {
        super();
    }
    setup(){
        var self = this;
        this.router.post('/register', function(req,res, next) {self.doRegistration(req,res,next)});
        this.router.get('/verify', function(req,res, next) {self.doEmailVerification(req,res,next)}); 
        this.router.post("/registrationDetails", function(req,res, next) {self.saveAdditionalDetails(req,res,next)});
        this.router.get("/registrationSuccess",this.getRegistrationSuccess.bind(this));
        return this;
    }
    doRegistration(req, res, next){
        var email = req.body.email, password = req.body.password, contactNo = req.body.mobileNo = req.body.mobileNo, passwordConf = req.body.passwordConf;
        var userDAO = new navUserDAO();
        var verificationCode;
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
                respUtil.redirect(req, res, "/registrationSuccess");
        },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
            /*response = new navResponseUtil().generateErrorResponse(error);
            res.status(response.status).render("errorDocument",{
                errorResponse : response,
                user : req.user,
                isLoggedIn : false,
                layout : 'nav_bar_layout',
            });*/

        })
        req.assert("email","Email is Required").notEmpty();
        req.assert("email","Valid Email Required").isEmail();
        req.assert("password","Password is Required").notEmpty();
        req.assert("password","Valid Password Required").isValidPassword();
        req.assert("passwordConf","Password is Required").notEmpty();
        req.assert("passwordConf","Valid Password Required").isValidPassword();
        req.assert("mobileNo","Mobile No Required").notEmpty();
        //req.assert("mobileNo","Valid Mobile No Required").isMobilePhone(contactNo, "any");
        var validationErrors = req.validationErrors();
        var response;
        console.log(validationErrors);
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        if(password != passwordConf) {
            return deferred.reject(new navLogicalException());
        }
        var verificationCode 
        userDAO.getLoginDetails(email)
        .then(function(user){
             if(user.length != 0) {
                 return Q.reject(new navUserExistsException());
             }
             var emailVer = new navEmailVerification();
             verificationCode = emailVer.generateCode();
	     var base = new navCommonUtil().getBaseURL(req);
	     base.pathname = "/verify";
	     base.search = "?id=" + verificationCode;
             var verificationLink = base.format();
             //return userDAO.insertRegistrationData(email, contactNo, password,verificationCode);
             //todo : uncomment when want to send verification email
             return emailVer.sendVerificationEmail(email, null, verificationLink)
        })
        .then(function (response) {
             navLogUtil.instance().log.call(self, "/register"," Sent verificiation email" + response, 'debug');
             return userDAO.insertRegistrationData(email, contactNo, new navPasswordUtil().encryptPassword(password), verificationCode);
        })
        .done(function(result){
             return deferred.resolve();
        },
        function (error) {
             return deferred.reject(error);
        });

    }
    saveRegistrationData(req, email, contactNo, password, deferred) {
    }
    doEmailVerification(req, res, next) {
        var code = req.query.id;
        var deferred = Q.defer();
        deferred.promise
            .done((user) => {
                res.render('registrationDetails',{
                    layout : "nav_bar_layout",
                    isLoggedIn : true,
                    user : user[0],
                    verificationCode : user[0].email_verification
                } );
            },(error) => {
                var respUtil =  new navResponseUtil();
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
                /*response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });*/
        
            });
        req.assert("id","Id is Required").notEmpty();
        req.assert("id","Id not valid").isUUID();

        var validationErrors = req.validationErrors();
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navLogicalException());
        }
        (new navUserDAO()).getUserDetailsByCode(code)
        .done(function (userDetails) {
            if (userDetails != 0) {
                return deferred.resolve(userDetails);
                res.render('registrationDetails',{
                    layout : "nav_bar_layout",
                    isLoggedIn : true,
                    user : userDetails[0],
                    verificationCode : userDetails[0].email_verification
                } );
            } else {
                return deferred.reject(new navLogicalException());
            }
        })
        
    }
    saveAdditionalDetails(req,res) {
        var body = req.body;
        var loginEmailId = body.email,
            firstName = body.firstName,
            lastName = body.lastName,
            address = body.shippingAddress,
            verificationCode = req.query.code;
        var userDAO = new navUserDAO(),
            client, user;

        var deferred = Q.defer();
        deferred.promise
            .done(() => {
                new navResponseUtil().redirect(req, res, "/pricing");
            },(error) => {
                var respUtil =  new navResponseUtil();
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
                /*response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,    
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });*/
        
             })
        req.assert("email","Email is Required").notEmpty();
        req.assert("email","Valid Email is Required").isEmail();
        req.assert("firstName","First Name is Required").notEmpty();
        req.assert("firstName","Max length of First name is 10").len(1,10);
        req.assert("lastName","First Name is Required").notEmpty();
        req.assert("shippingAddress","First Name is Required").notEmpty();
        req.assert("code","Code is Required").notEmpty();
        req.assert("code","Bad Request").isUUID();


        var validationErrors = req.validationErrors();
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        userDAO.getClient()
            .then(function (_client) {
            userDAO.providedClient = _client;
            return userDAO.startTx();
        })
        .then(function () {
            return userDAO.getUserDetailsByCode(verificationCode);
        })
        //todo : uncomment once email verification done and comment above then
        .then(function (userDetails) {
            if(userDetails.length == 0) {
                return Q.reject(new navLogicalException());
            }
            if(userDetails[0].email_address != loginEmailId) {
                return Q.reject(new navLogicalException());
            }

            user = userDetails[0];
            if (user.email_verification == verificationCode) {
                return userDAO.clearVerificationCode(user._id)
            } else {
                return Q.reject(new navLogicalException());
            }
        })
        .then(function () {
            var time = new navCommonUtil().getCurrentTime();
            return userDAO.updateUserDetails(user._id, firstName, lastName, address, moment().add(30, "days").valueOf(), time);
        })
        .then(function () {
            return userDAO.commitTx();
        })
        .catch(
        function (error) {
            //logg error
            navLogUtil.instance().log.call(self,'[/registerDetails]', 'Error while doing registration step 2' + error, "error");
            return userDAO.rollBackTx()
                .then(function () {
                    return Q.reject(error);
                    //res.status(500).send("Internal Server Error");
                })
                .catch(function (err) {
                    //log error
                    return Q.reject(err)
                })
        })
        .finally(function () {
            if (userDAO.providedClient) {
                userDAO.providedClient.release();
                userDAO.providedClient = undefined;
            }
        })
        .done(() => {
            req.logIn(user, err => {
                if (err) {
                    return deferred.reject(err);
                }
                // Redirect to homepage
                return deferred.resolve();
            }) 
        },(error) => {
            return deferred.reject(error);
        });
    }
    getRegistrationSuccess(req, res, next) {
                res.render('registrationSuccess',{
                    layout : 'nav_bar_layout',
                    isLoggedIn : req.user ? true : false,
                });
    }
}
