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
        this.router.get('/', this.ensureVerified, this.getHome);
        this.router.get('/about', this.getAbout.bind(this));
        this.router.get('/contact',this.getContact.bind(this) );
        this.router.get('/pricing', this.getPricing.bind(this) );
        this.router.get('/howItWorks', this.getHowItWorks.bind(this) );
        this.router.get('/rechargeConfirmation', this.getRechargeConfirmation.bind(this) );
        this.router.get('/subscribeMembership', this.subscribeMembership.bind(this) );
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
            var promise = Q.resolve();

            if(!req.user){
                promise = (new navToysDAO()).getAllToys(0,10);
            }
            else{
                promise = (new navToysDAO()).getAllToys(0,10);
            }
            var toys;
            promise
                .then((toysList) => {
                    toys = toysList;
                    var promises = [];
                    for(var z = 0; z < toysList.length; z++) {
                        promises.push(new navSkillsDAO().getSkillsForToy(toysList[z]._id));
                    }
                    return Q.allSettled(promises);
                })
            .then(function(results){
                for(var w = 0; w < results.length; w++) {
                    if(results[w].state == 'rejected') {
                        return Q.reject(results[w].reason)
                    }
                    toys[w].skills = results[w].value;
                }
                res.render('index', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    toysList : toys
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
        var plans , type = req.query.type, plan = req.query.plan, paymentMethod = req.body.paymentMethod;

        if(type == "member") {
            plans =  navMembershipParser.instance().getConfig("membership",[]);
        } else {
            plans = navMembershipParser.instance().getConfig("plans",[])[type];
        }

        if(!plans || plans[plan] === undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
        var p=plans[plan];

        var user = req.user;
        var uDAO = new navUserDAO();
        var deposit, orderId, result;
        uDAO.getClient()
            .then((_client) => {
                uDAO.providedClient = _client;
                return uDAO.startTx();
            })
            .then(() => {
                if(type === "member") {
                    return Q.resolve();
                } else {
                    return uDAO.updatePlan(user._id,type + "::" + plan);
                }
            })
            .then((result) => {
                orderId = new navCommonUtil().generateUuid();
                deposit = parseInt(p.deposit) - user.deposit;
                var pDAO;
                if(type === "member") {
                    pDAO = new navPaymentsDAO(uDAO.providedClient);
                    if(paymentMethod === "cash") {
                        return pDAO.insertPaymentDetails(user._id, p.amount , pDAO.REASON.REGISTRATION, pDAO.STATUS.PENDING_COD, orderId, pDAO.TRANSACTION_TYPE.CASH);       
                    } else if(paymentMethod === "paytm") {
                        return pDAO.insertPaymentDetails(user._id, deposit, pDAO.REASON.REGISTRATION, pDAO.STATUS.PENDING, orderId, pDAO.TRANSACTION_TYPE.PAYTM);       
                    } else {
                        return Q.reject(new Error("Undefined payment method"));
                    }
                
                }
                if(deposit > 0) {
                    pDAO = new navPaymentsDAO(uDAO.providedClient);
                    if(paymentMethod === "cash") {
                        return pDAO.insertPaymentDetails(user._id, deposit, pDAO.REASON.DEPOSIT, pDAO.STATUS.PENDING_COD, orderId, pDAO.TRANSACTION_TYPE.CASH);       
                    } else if(paymentMethod === "paytm") {
                        return pDAO.insertPaymentDetails(user._id, deposit, pDAO.REASON.DEPOSIT , pDAO.STATUS.PENDING, orderId, pDAO.TRANSACTION_TYPE.PAYTM);       
                    } else {
                        return Q.reject(new Error("Undefined payment method"));
                    }
                } else {
                    return Q.resolve();
                    //return Q.reject(new navLogicalException("Account Already Recharged"));
                }
            })
            .then(() => {
                var pDAO = new navPaymentsDAO(uDAO.providedClient);
                if(type === "member") {
                    return Q.resolve();
                }else {
                    if(paymentMethod === "cash") {
                        return pDAO.insertPaymentDetails(user._id, p.amount, pDAO.REASON.PLANS[type][plan], pDAO.STATUS.PENDING_COD, orderId, pDAO.TRANSACTION_TYPE.CASH);
                    } else if(paymentMethod === "paytm") {
                        return pDAO.insertPaymentDetails(user._id, p.amount, pDAO.REASON.PLANS[type][plan], pDAO.STATUS.PENDING, orderId, pDAO.TRANSACTION_TYPE.PAYTM);
                    } else {
                        return Q.reject(new Error("Undefined payment method"));
                    }
                }
            })
            .then(() => {
                var promises = [];
                if(paymentMethod === "cash") {
                    return new navPayments(uDAO.providedClient).success(orderId, "TXN_SUCCESS", "0", "Cash on Delivery", true);
                } else if(paymentMethod === "paytm") {
                    return navPGRouter.initiate(user._id, (parseInt(p.amount) + deposit) + "", orderId, new navCommonUtil().getBaseURL(req));
                } else {
                    return Q.resolve();
                }
            })
            .then((_result) => {
                if(paymentMethod === "paytm") {
                    result = _result;
                }
                return uDAO.commitTx();
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
                return deferred.resolve(result);

                //res.redirect("/login");
            },(error) => {
                return deferred.reject(error);
            });

        
    }

    getRechargeConfirmation(req, res) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        var plans, type = req.query.type, plan = req.query.plan;
        deferred.promise
            .done(function(){
                res.render('rechargeConfirmation', {
                    user : req.user,
                    plan : p,
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
        if(type == "member") {
            plans =  navMembershipParser.instance().getConfig("membership",[]);
        } else {
            plans = navMembershipParser.instance().getConfig("plans",[])[type];
        }

        if(!plans || plans[plan] === undefined) {
            return deferred.reject(new navLogicalException(validationErrors));
        }
        var p = plans[plan];
        return deferred.resolve(); 

    }

    subscribeMembership(req, res) {
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
            /*.then(() => {
                return uDAO.updateMembershipExpiry(user._id, null);
            })*/
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
	

    }
}
