var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navPGRouter = require(process.cwd() + "/lib/navPGRouter.js"),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navSkillsDAO = require(process.cwd() + "/lib/dao/skills/navSkillsDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    navToysHandler = require(process.cwd() + "/lib/navToysHandler.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    helpers = require('handlebars-helpers')(),
    moment =require('moment'),
    Q = require('q');

module.exports = class navMainRouter extends navBaseRouter {
    constructor(){
       super();
    }

    setup(){        
        this.router.get('/', this.ensureVerified.bind(this), this.getHome.bind(this));
        this.router.get('/about', this.getAbout.bind(this));
        this.router.get('/contact',this.getContact.bind(this) );
        this.router.get('/pricing', this.getPricing.bind(this) );
        this.router.get('/howItWorks', this.getHowItWorks.bind(this) );
        this.router.get('/rechargeConfirmation', this.getRechargeConfirmation.bind(this) );
        this.router.post('/subscribePlan', this.ensureVerified.bind(this), 
                        this.ensureAuthenticated.bind(this), 
                        this.isSessionAvailable.bind(this), 
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
    getHowItWorks(req, res) {

        res.render('howItWorks', {
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
        new navToysHandler().getToysList(req.user ? true : false, 0, 10, {}, [])
            .done((result) => {
                res.render('index', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    toysList : result.toys
                });
            
            },function(error){
                //var response = new navResponseUtil().generateErrorResponse(error);
                var respUtil =  new navResponseUtil();
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
            });

    }

    subscribePlan(req, res){
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                if(result) {
                    res.render(result.pageToRender, {data : result.context, redirectURL : result.redirectURL});
                } else {
                    respUtil.redirect(req, res, '/user/rechargeDetails');
                }
                //respUtil.redirect(req, res, "/");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
            
                });
        });

        req.assert("type","type is required").notEmpty();
        req.assert("plan","Plan is  Required").notEmpty();
        //req.assert("type","Type is not a number").isInt();
        req.assert("plan","Plan is not a number").isInt();
        req.assert("paymentMethod","paymentMethod is required").notEmpty();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var type = req.query.type, plan = req.query.plan, paymentMethod = req.body.paymentMethod;

        /*if(type == "member") {
            plans =  navMembershipParser.instance().getConfig("membership",[]);
        } else {
            plans = navMembershipParser.instance().getConfig("plans",[])[type];
        }

        if(!plans || plans[plan] === undefined) {
            return deferred.reject(new navLogicalException());
        }
        var p=plans[plan];
        navLogUtil.instance().log.call(self, self.subscribePlan.name, "Plan details : " + p +", type : "+type, "info");*/

        var user = req.user;
        var uDAO = new navUserDAO();
        var result;
        uDAO.getClient()
            .then((_client) => {
                uDAO.providedClient = _client;
                return uDAO.startTx();
            })
            .then(() => {
                return new navAccount().getRechargeDetails(user, type, plan);
            })
            .then((transactions) => {
                navLogUtil.instance().log.call(self, self.subscribePlan.name, "Initiating payment for TransactionId : "+ transactions.transactionId +", for User : "+user._id + ", with PaymentMethod : " + paymentMethod, "info");
                return new navPayments(uDAO.providedClient).doPayments(transactions.transactionId, user._id, transactions.transactions, paymentMethod, new navCommonUtil().getBaseURL(req));
            })
            .then((_result) => {
                result = _result;
                return uDAO.commitTx();
            })

            .catch(function (error) {
                //logg error
                navLogUtil.instance().log.call(self, self.subscribePlan.name, "Error occured , Reason : "+error , "error");
                return uDAO.rollBackTx()
                .then(function () {
                    return Q.reject(error);
                    //res.status(500).send("Internal Server Error");
                })
                .catch(function (err) {
                    //log error
                    navLogUtil.instance().log.call(self, self.subscribePlan.name, "Error occured , Reason : "+err , "error");
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
                return deferred.resolve(result);

                //res.redirect("/login");
            },(error) => {
                navLogUtil.instance().log.call(self, self.subscribePlan.name, "Error occured , Reason : "+error.stack , "error");
                return deferred.reject(error);
            });

        
    }

    getRechargeConfirmation(req, res) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        var type = req.query.type, plan = req.query.plan;
        deferred.promise
            .done(function(result){
                res.render('rechargeConfirmation', {
                    user : req.user,
                    transactions : result,
                    q_type : type,
                    q_plan : plan,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    helpers : {
                        helper : helpers
                    }
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
        //req.assert("type","Type is not a number").isInt();
        req.assert("plan","Plan is not a number").isInt();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        return new navAccount().getRechargeDetails(req.user, type, plan)
            .done((result) => {
                deferred.resolve(result.transactions);
            },(error) => {
                navLogUtil.instance().log.call(self, self.getRechargeConfirmation.name, "Error occured , Reason : "+error.stack , "error");
                deferred.reject(error);
            })

    }

    /* subscribeMembership(req, res) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil(), result;
        deferred.promise
            .done(function(){
		res.render(result.pageToRender, {data : result.context, redirectURL : result.redirectURL});
                //respUtil.redirect(req, res, "/user/rechargeDetails");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });
        });

        req.assert("plan","Plan is  Required").notEmpty();
        req.assert("plan","Plan is not a number").isInt();

        var validationErrors = req.validationErrors();
        if(validationErrors) {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var plans = navMembershipParser.instance().getConfig("membership",[]), plan = req.query.plan;
        if(plans[plan] === undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
        var p=plans[plan];

        var user = req.user, uDAO = new navUserDAO(), orderId;
        uDAO.getClient()
            .then((_client) => {
                uDAO.providedClient = _client;
                return uDAO.startTx();
            })
            .then((result) => {
		orderId = new navCommonUtil().generateUuid();
                if(result) {
                    var pDAO = new navPaymentsDAO(uDAO.providedClient);
                    return pDAO.insertPaymentDetails(user._id, p.amount, pDAO.REASON.REGISTRATION, pDAO.STATUS.PENDING, orderId);       
                } else {
                    return Q.reject(new navLogicalException("Account Already Recharged"));
                }
            })
	    .then(() => {
		return navPGRouter.initiate(user._id, parseInt(p.amount) + "", orderId, new navCommonUtil().getBaseURL(req));
	    })
            .then((_result) => {
		result = _result;
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
	

    }*/
}
