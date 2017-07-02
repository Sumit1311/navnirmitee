var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');

module.exports = class navUserAccountRouter extends navBaseRouter {
    constructor() {
        super(); 
    }
    setup(){
        var self = this;
        this.router.use(this.isSessionAvailable, this.ensureAuthenticated, this.ensureVerified)
        this.router.get('/rechargeDetails', function(req,res, next) {self.getRechargeDetails(req,res,next)});
        this.router.get('/orderDetails', function(req,res, next) {self.doOrderDetails(req,res,next)}); 
        this.router.get("/accountDetails", function(req,res, next) {self.getAccountDetails(req,res,next)});
        return this;
    }

    getRechargeDetails(req, res, next) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
                res.render("rechargeDetails",{
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                
                });
        },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
        });

        return deferred.resolve();
    
    }


}
