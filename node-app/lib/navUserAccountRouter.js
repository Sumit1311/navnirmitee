var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    navCommonUtil = require(process.cwd() + '/lib/navCommonUtil.js'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navOrders = require(process.cwd() + "/lib/navOrders.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    Q = require('q');

module.exports = class navUserAccountRouter extends navBaseRouter {
    constructor() {
        super(); 
    }
    setup(){
        var self = this;
        this.router.use(this.isSessionAvailable.bind(this), this.ensureAuthenticated.bind(this), this.ensureVerified.bind(this))
        this.router.get('/rechargeDetails', function(req,res, next) {self.getRechargeDetails(req,res,next)});
        this.router.get('/orderDetails', function(req,res, next) {self.getOrderDetails(req,res,next)}); 
        this.router.get("/accountDetails", function(req,res, next) {self.getAccountDetails(req,res,next)});
        return this;
    }

    getRechargeDetails(req, res) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        var user = req.user, userDetails, debitTransactions = [], creditTransactions = [], plans, membershipPlans;
        deferred.promise
            .done(function(){
                var transactions = debitTransactions.concat(creditTransactions);
                transactions.sort(function(a, b){
                    if(a.dateMilis < b.dateMilis) {
                        return true;
                    }
                    return false;
                })
                res.render("rechargeDetails",{
                    user : req.user,
                    userDetails : {
                        enrollmentDate : new navCommonUtil().getDateString(parseInt(userDetails.enrollment_date)),
                        membershipExpiryDate : userDetails.membership_expiry !== null ? new navCommonUtil().getDateString(parseInt(userDetails.membership_expiry)) : false,
                        deposit : userDetails.deposit,
                        balance : userDetails.balance,
                        membershipStatus :   (userDetails.membership_expiry === null ? true : ( parseInt(userDetails.membership_expiry) > new navCommonUtil().getCurrentTime()) ? true : false),
                    },
                    transactions : transactions,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    plans : plans,
                    membershipPlans : membershipPlans,
                    helpers : {
                        getClass : function(status) {
                            var lableClass;
                            switch(status) {
                                case navPaymentsDAO.getStatus().PENDING :
                                case navPaymentsDAO.getStatus().PENDING_COD :
                                    lableClass = "warning";
                                    break;
                                case navRentalsDAO.getStatus().DELIVERED:
                                case navRentalsDAO.getStatus().PLACED:
                                case navRentalsDAO.getStatus().RETURNED:
                                case navPaymentsDAO.getStatus().COMPLETED :
                                    lableClass = "success";
                                    break;
                                case navRentalsDAO.getStatus().CANCELLED:
                                case navPaymentsDAO.getStatus().CANCELLED :
                                case navPaymentsDAO.getStatus().FAILED :
                                    lableClass = "danger";
                                    break;

                                default :
                                    lableClass = "default";
                                    break;

                            }
                            return lableClass;
                        }
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
        new navAccount().getWalletDetails(user._id)
            .then((_userDetails) =>{
                userDetails = _userDetails[0];
                return new navPayments().getPayments(user._id);
            } )
            .then((_transactions) => {
                creditTransactions = _transactions;
                return new navOrders().getOrders(user._id);
            })
            .done((_transactions) => {
                debitTransactions = _transactions;
                plans = navMembershipParser.instance().getConfig("plans",[]); 
                membershipPlans =  navMembershipParser.instance().getConfig("membership",[]); 
                deferred.resolve();
            },(error) => {
                navLogUtil.instance().log.call(self, self.getRechargeDetails.name, "Error occured Details : " + error, "error");
                deferred.reject(error);
            });
    
    }

    getOrderDetails(req, res){
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        var user = req.user;
        deferred.promise
            .done(function(orders){
                res.render("orderDetails",{
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    orders : orders,
                    helpers : {
                        getClass : function(status) {
                            var lableClass;
                            console.log(status);
                            switch(status) {
                                case navRentalsDAO.getStatus().DELIVERED:
                                    lableClass = "success";
                                    break;
                                case navRentalsDAO.getStatus().PLACED:
                                    lableClass = "info";
                                    break;
                                case navRentalsDAO.getStatus().RETURNED:
                                    lableClass = "warning";
                                    break;
                                case navRentalsDAO.getStatus().CANCELLED:
                                    lableClass = "danger";
                                    break;
                                default :
                                    lableClass = "default";
                                    break;
                            }
                            return lableClass;
                        }
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
        return new navOrders().getOrders(user._id)
            .done((_orders) => {
                deferred.resolve(_orders);
            },(error) => {
                navLogUtil.instance().log.call(self, self.getOrderDetails.name, "Error occured Details : " + error, "error");
                deferred.reject(error);
            });
    
    }
}
