var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navAuthenticateUser = require(process.cwd() + "/lib/navAuthenticateUser.js"),
    Q = require('q');
    

module.exports = class navSignInRouter extends navBaseRouter {
    constructor(){
        super();
    }

    setup(){
        this.router.post('/', this.authentication);
        this.router.get('/logout', this.ensureAuthenticated, this.isSessionAvailable, this.logOut);        
        //the path which will be used to login this is the route for displaying sign in page to user
        this.router.get('/login', this.ensureAuthenticated,this.ensureVerified, this.logIn);
        return this;
    }

    authentication(req, res, next) {    
        var deferred = Q.defer();
        deferred.promise
            .done(function(){
                new navResponseUtil().redirect(req, res, '/');
            },(error) => {
                var respUtil =  new navResponseUtil();
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
             });
        new navAuthenticateUser().authenticate(req, res, deferred);
    }
    logOut(req, res) {
        req.session.destroy();
        new navResponseUtil().redirect(req, res, '/');
    }
    logIn (req, res) {
        //if the user is already authenticated i.e. exist in the session then continue to the home page
        new navResponseUtil().redirect(req, res, '/');
    }
}
