var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navValidationException = require(proces.cwd() + "/lib/exceptions/navValidationException.js"),
    Q = require('q');

module.exports = class navMainRouter extends navBaseRouter {
    constructor(){
       super();
    }

    setup(){        
        this.router.get('/', this.ensureVerified, this.getHome);
        this.router.get('/about', this.getAbout.bind(this));
        this.router.get('/contact',this.getContact.bind(this) );
        this.router.get('/pricing', this.getPricing.bind(this) );
        this.router.post('/subscribePlan', this.ensureVerified, 
                        this.ensureAuthenticated, 
                        this.isSessionAvailable, 
                        this.subscribePlan.bind(this));
        return this;
    }
    getPricing(req, res) {

        var plans = navMembershipParser.instance().getConfig("plans");
        res.render('pricing', {
            plans : plans,
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout'
        });
    }
    getContact(req, res){
        res.render('contact', {
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout'
        });
    }

    getAbout(req,res) {
        res.render('about', {
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout'
        });

    }

    getHome(req, res){
            var promise = Q.resolve();

            if(!req.user){
                promise = (new navToysDAO()).getAllToys(0,10);
            }
            else{
                promise = (new navToysDAO()).getAllToys(0,10);
            }

            promise
            .then(function(toysList){
                res.render('index', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    toysList : toysList
                });
            })
            .done(null,function(error){
                //var response = new navResponseUtil().generateErrorResponse(error);
                var respUtil =  new navResponseUtil();
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
                /*res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                });*/
            });

    }

    subscribePlan(req, res){
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
                respUtil.redirect(req, res, "/");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
        });

        req.assert("type","Type is Required").notEmpty();
        req.assert("plan","Plan is  Required").notEmpty();
        req.assert("type","Type is not a number").isNumber();
        req.assert("plan","Plan is not a number").isNumber();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var plans = navMembershipParser.instance().getConfig("plans",[]);
        if(plans[type][plan] == undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
    }
    
}
