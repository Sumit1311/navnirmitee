var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navOrders = require(process.cwd() + "/lib/navOrders.js"),
    navSystemUtil = require(process.cwd() + "/lib/navSystemUtil.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    navMembershipExpirationException =  require(process.cwd() + "/lib/exceptions/navMembershipExpirationException.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navNoSubScriptionException = require(process.cwd() + "/lib/exceptions/navNoSubscriptionException.js"),
    navNoBalanceException = require(process.cwd() + "/lib/exceptions/navNoBalanceException.js"),
    navNoStockException = require(process.cwd() + "/lib/exceptions/navNoStockException.js"),
    navPendingReturnException = require(process.cwd() + "/lib/exceptions/navPendingReturnException.js"),
    repeatHelper = require('handlebars-helper-repeat'),
    helpers = require('handlebars-helpers')(),
    passport = require('passport'),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    url = require("url"),
    Q = require('q'),
    querystring = require("querystring"),
    moment = require('moment');

module.exports = class navToysRouter extends navBaseRouter {
    constructor() {
        super();
    }

    setup() {
        var self = this;
        this.router.use(this.ensureAuthenticated, this.ensureVerified, this.isSessionAvailable);
        this.router.get('/detail', function(req,res,next){self.getToysDetails(req,res,next)});
        this.router.get('/search', function(req,res,next){self.getSearchPage(req,res,next)});
        this.router.get('/order', function(req,res,next){self.getOrder(req,res,next)});
        this.router.get('/orderPlaced', function(req,res,next){self.getOrderPlaced(req,res,next)});
        this.router.post('/placeOrder',(req, res, next) => {self.placeOrder(req,res,next)});
        this.router.post('/cancelOrder',(req, res, next) => {self.cancelOrder(req,res,next)});
        return this;
    }
    getToysDetails(req, res) {
        var id = req.query.id, toy;
        var deferred = Q.defer();
        deferred.promise
            .done((result) => {
                res.render('detail', {
                    user: req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    toyDetail : toy[0],
                    imageCount : result,
                    helpers : {
                        repeat : repeatHelper,
                    helper : helpers
                    }
                });
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
        req.assert("id"," Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var navTDAO = new navToysDAO();
        navTDAO.getToyDetailById(id)
            .then(function(toyDetail){
                if(toyDetail.length == 0) {
                    return Q.reject(new navLogicalException());
                }
                toy = toyDetail;
                return new navSystemUtil().getNoOfFilesMatchPat(toyDetail[0]._id+'_*',process.cwd() + '/../public/img/toys/');
            })
        .done(function(result){
            return deferred.resolve(result);
        },function(error){
            return deferred.reject(error);
        });
    } 
    getOrder(req, res) {
        var id = req.query.id, user = req.user;
        var deferred = Q.defer();
        deferred.promise
            .done((result) => {
                res.render('order', {
                    user : user,
                    layout : 'nav_bar_layout',
                    isLoggedIn : req.user ? true : false,
                    toyDetail : result[0]
                });
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
        req.assert("id"," Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var userDAO = new navUserDAO();
        userDAO.getAddress(user._id)
            .then(function(n_User){
                user.address = n_User[0].address;
                user.city = n_User[0].city;
                user.state = n_User[0].state;
                return (new navToysDAO()).getToyDetailById(id)
            })
        .then(function(toyDetail){
            //console.log(toyDetail, id);
            if(toyDetail.length == 0) {
                return Q.reject(new navLogicalException());
            }
            return toyDetail;
        })
        .done((toyDetail) => {
            deferred.resolve(toyDetail);
        },(err) => {
            deferred.reject(err);
        });
    }
    placeOrder(req, res){
        var id = req.query.id, dbClient; 
        var deferred = Q.defer();
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done((result) => {
                respUtil.redirect(req, res, '/toys/orderPlaced');
            },(error) => {
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
        req.assert("id"," Bad Request").notEmpty();
        req.assert("shippingAddress","Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response, user = req.user;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        var rDAO = new navRentalsDAO();
        var userDetails, toyDetails;
        debugger;
        rDAO.getClient()
            .then(function(client){
                rDAO.providedClient = client;
                return rDAO.startTx();
            })
        .then(() => {
            var uDAO = new navUserDAO(rDAO.providedClient);
            return uDAO.getUserDetails(user._id);
        })
        .then((_userDetails) => {
            userDetails = _userDetails[0];
            if(userDetails.subscribed_plan == null || userDetails.deposit == null) {
                return Q.reject(new navNoSubScriptionException());
            }
            if(userDetails.membership_expiry != null && userDetails.membership_expiry < new navCommonUtil().getCurrentTime()) {
                return Q.reject(new navMembershipExpirationException());
            }
            return rDAO.getOrdersByUserId(user._id);
            //TODO : check what to do with the order where lease date is ended but toy is not delivered
        })
        .then((_orders) => {
            if(_orders.length != 0) {
                return Q.reject(new navPendingReturnException());
            }
            return new navToysDAO(rDAO.providedClient).getToyDetailById(id);
        })
        .then((_toyDetails) => {
            if(_toyDetails.length != 0) {
                toyDetails =  _toyDetails[0];
                if(toyDetails.price > userDetails.balance) {
                    return Q.reject(new navNoBalanceException());
                }
                if(toyDetails.stock == 0) {
                    return Q.reject(new navNoStockException());
                
                }
                //var splittedPlan = userDetails.subscribed_plan.split('::');
                //console.log(userDetails.subscribed_plan);
                //var plan = navMembershipParser.instance().getConfig("plans",[])[splittedPlan[0]][splittedPlan[1]];
                return rDAO.saveAnOrder(req.user._id, id, req.body.shippingAddress, new Date().getTime(), moment().add(15,'days').valueOf(), rDAO.STATUS.PLACED);
            } else {
                return Q.resolve();
            }
        })
        .then(function(){
            if(toyDetails) {
                var membershipExpiry;
                if(userDetails.membership_expiry != null) {
                    membershipExpiry = new navCommonUtil().getCurrentTime();
                }
                return new navUserDAO(rDAO.providedClient).updatePoints(user._id, (userDetails.balance) - (toyDetails.price), membershipExpiry);
            } else {
                return Q.resolve();
            }
        })
        .then(function() {
            if(toyDetails) {
                return new navToysDAO(rDAO.providedClient).updateToyStock(toyDetails._id, 1);
            } else {
                return Q.resolve();
            }
        })
        .then(function(){
            return rDAO.commitTx();
        })
        .catch(function(error){

            return rDAO.rollBackTx()
            .then(function () {
                /*switch(error.name) {
                  case "navNoBalanceException" :
                  return Q.resolve({
                  redirect : "/"
                  })
                  break;
                  case "navNoSubscriptionException" :
                  return Q.resolve({
                  redirect : "/"
                  })
                  break;
                  default:
                  return Q.reject(error);
                  }*/
                //res.status(500).send("Internal Server Error");
                return Q.reject(error);
            })
            .catch(function (err) {
                //log error
                return Q.reject(err);
            })
        })
        .finally(function () {
            if (rDAO.providedClient) {
                rDAO.providedClient.release();
                rDAO.providedClient = undefined;
            }
        })
        .done(() => {
            deferred.resolve();
        },(error) => {
            deferred.reject(error);
        });
    }
    getOrderPlaced(req,res) {
        res.render('orderPlaced',{
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout'
        });
    }    
    getSearchPage(req, res) {
        var q = req.query.q, offset = req.query.offset, activeCategories = [], activeAgeGroups = []; 
        console.log(req.query);
        if(!offset ) {
            offset = 0;
        }
        
        for(var key in req.query) {
            if((key == "category") && req.query.hasOwnProperty(key)) {
                for(var index in req.query[key]) {
                activeCategories.push(parseInt(req.query[key][index]) - 1);
                }
            }
            if((key == "ageGroup") && req.query.hasOwnProperty(key)) {
                for(var index in req.query[key]) {
                activeAgeGroups.push(parseInt(req.query[key][index]) - 1);
                }
            }
        }
        
        req.assert("q"," Bad Request").isByteLength({min :0, max :128});
        //req.assert("shippingAddress","Bad Request").notEmpty();
        var deferred = Q.defer();
        var respUtil =  new navResponseUtil(), toyList, categories, ageGroups, noOfPages, perPageToys = 4;
        //console.log(repeatHelper);
        deferred.promise
            .done((result) => {
                console.log(activeAgeGroups);
                function genQueryParams() {
                    var val = "";
                    for(var i in req.query){
                        if(req.query.hasOwnProperty(i) && i != "offset") {
                            val += i + "=" + req.query[i] + "&"
                        }
                    }
                    //val.charAt[val.length -1] = "";
                console.log(val);
                    return val;
                }
                delete req.query.offset;
                console.log(querystring.stringify(req.query));
                res.render('searchToys', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    query : q,
                    queryParameters : querystring.stringify(req.query),
                    toysData : {
                        toysList : toyList,
                        filters : {
                            categories : categories,
                            ageGroups : ageGroups,
                            activeCategories : activeCategories,
                            activeAge : activeAgeGroups
                        },
                        noOfPages : noOfPages,
                        perPageLimit : perPageToys,
                        currentPage : offset ? (Math.floor(offset/perPageToys) + 1) : 1

                    },
                        helpers : {
                            repeat : repeatHelper
                        }

                })    
            },(error) => {
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


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response, user = req.user;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
        ageGroups = navCommonUtil.getAgeGroups();
        categories = navCommonUtil.getCategories();
        new navToysDAO().getAllToys(null, null, activeAgeGroups, activeCategories, q.split(" "))
            .then((toys) => {
                toyList = [];
                /*var temp = [];
                for(var i in activeAgeGroups) {
                    temp[activeAgeGroups[i]] = true;
                }
                activeAgeGroups = temp;
                temp = [];
                for(var i in activeCategories) {
                    temp[activeCategories[i]] = true;
                }
                activeCategories = temp;*/
                if(toys.length % perPageToys != 0 ) {
                noOfPages = Math.floor(toys.length / perPageToys) + 1;
                } else {
                noOfPages = Math.floor(toys.length / perPageToys) ;

                }
                for(var i = 0; i < toys.length; i++) {
                    if(i >= offset) {
                        toyList.push(toys[i]);
                    }
                    if(toyList.length == perPageToys) {
                        break;
                    }
                }
                return Q.resolve();
            })
            .done(() => {
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            });


    }

    cancelOrder(req, res) {
         var orderId = req.query.orderId;
        var deferred = Q.defer();
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done((result) => {
                respUtil.redirect(req, res, '/user/orderDetails');
            },(error) => {
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
        req.assert("orderId"," Bad Request").notEmpty();
        req.assert("orderId","Bad Request").isUUID();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response, user = req.user;
        if(validationErrors)
        {
            return deferred.reject(new navValidationException(validationErrors));
        }
         new navOrders().updateOrder(orderId, null, null, {
            orderStatus : navRentalsDAO.getStatus().CANCELLED
         })
             .done(() => {
                deferred.resolve();
             },(error) => {
                deferred.reject(error);
             })
    }
}
