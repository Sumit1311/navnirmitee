var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js")
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    moment =require('moment'),
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
        this.router.get('/rechargeConfirmation',  
                        this.ensureAuthenticated, this.ensureVerified,
                        this.isSessionAvailable,this.getRechargeConfirmation.bind(this) );
        this.router.post('/subscribePlan', 
                        this.ensureAuthenticated, this.ensureVerified, 
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
        req.assert("type","Type is not a number").isInt();
        req.assert("plan","Plan is not a number").isInt();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var plans = navMembershipParser.instance().getConfig("plans",[]), type = req.query.type, plan = req.query.plan;
        if(plans[type][plan] == undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
        var p=plans[type][plan];

        var user = req.user;
        var uDAO = new navUserDAO();

        uDAO.getClient()
            .then((_client) => {
                uDAO.providedClient = _client;
                return uDAO.startTx();
            })
            .then(() => {
                return uDAO.updatePlan(user._id,type + "::" + plan ,p.points, p.deposit, p.amount);
            })
            .then((result) => {
                console.log(result);
                if(result) {
                    var pDAO = new navPaymentsDAO(uDAO.providedClient);
                    return pDAO.insertPaymentDetails(user._id, p.deposit, pDAO.REASON.DEPOSIT, pDAO.STATUS.PENDING);       
                } else {
                    return Q.reject(new navLogicalException("Account Already Recharged"));
                }
            })
            .then(() => {
                var pDAO = new navPaymentsDAO(uDAO.providedClient);
                return pDAO.insertPaymentDetails(user._id, p.amount, pDAO.REASON["RECH"+p.amount], pDAO.STATUS.PENDING);
            })
            .then(() => {
                uDAO.commitTx();
            })
            .catch(function (error) {
                //logg error
                navLogUtil.instance().log.call(self,'[/subscribePlan]', 'Error while doing payment' + error, "error");
                return uDAO.rollBackTx()
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
                if (uDAO.providedClient) {
                    uDAO.providedClient.release();
                    uDAO.providedClient = undefined;
                }
            })
            .done(() => {
                return deferred.resolve();

                //res.redirect("/login");
            },(error) => {
                return deferred.reject(error);
            });

        
    }

    getRechargeConfirmation(req, res) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
                res.render('rechargeConfirmation', {
                    user : req.user,
                    plan : p,
                    q_type : type,
                    q_plan : plan,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
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
        req.assert("type","Type is Required").notEmpty();
        req.assert("plan","Plan is  Required").notEmpty();
        req.assert("type","Type is not a number").isInt();
        req.assert("plan","Plan is not a number").isInt();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var plans = navMembershipParser.instance().getConfig("plans",[]), type = req.query.type, plan = req.query.plan;
        if(plans[type][plan] == undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
        var p=plans[type][plan];
        return deferred.resolve(); 

    }
}
