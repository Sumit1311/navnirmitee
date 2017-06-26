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
                res.redirect('/');
            },(error) => {
                var response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                })
             });
        navAuthenticateUser().authenticate(req, res);
    }
    logOut(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
    logIn (req, res) {
        //if the user is already authenticated i.e. exist in the session then continue to the home page
        res.redirect('/');
    }
}
