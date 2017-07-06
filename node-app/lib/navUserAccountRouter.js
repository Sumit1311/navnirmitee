var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    navCommonUtil = require(process.cwd() + '/lib/navCommonUtil.js'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    Q = require('q');

module.exports = class navUserAccountRouter extends navBaseRouter {
    constructor() {
        super(); 
    }
    setup(){
        var self = this;
        this.router.use(this.isSessionAvailable, this.ensureAuthenticated, this.ensureVerified)
        this.router.get('/rechargeDetails', function(req,res, next) {self.getRechargeDetails(req,res,next)});
        this.router.get('/orderDetails', function(req,res, next) {self.getOrderDetails(req,res,next)}); 
        this.router.get("/accountDetails", function(req,res, next) {self.getAccountDetails(req,res,next)});
        return this;
    }

    getRechargeDetails(req, res, next) {
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
                        membershipExpiryDate : userDetails.membership_expiry != null ? new navCommonUtil().getDateString(parseInt(userDetails.membership_expiry)) : false,
                        deposit : userDetails.deposit,
                        balance : userDetails.balance,
                        membershipStatus :   (userDetails.membership_expiry != null  && userDetails.membership_expiry > new navCommonUtil().getCurrentTime()) ? true : false,
                    },
                    transactions : transactions,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    plans : plans,
                    membershipPlans : membershipPlans,
		    helpers : {
			getClass : function(status, options) {
				var lableClass;
				switch(status) {
				    case navPaymentsDAO.getStatus().PENDING :
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
        new navUserDAO().getUserDetails(user._id)
            .then((_userDetails) =>{
                userDetails = _userDetails[0];
                return new navPaymentsDAO().getAllPaymentTransactions(user._id);
            } )
            .then((_transactions) => {
                for(var i = 0; i < _transactions.length; i++) {
                    creditTransactions[i] = navTransactions.createObject(_transactions[i], navTransactions.getType().PAYMENTS); 
                }
                return new navToysDAO().getAllRentalTransactions(user._id);
            })
            .done((_transactions) => {
                for(var i = 0; i < _transactions.length; i++) {
                    debitTransactions[i] = navTransactions.createObject(_transactions[i], navTransactions.getType().RENT); 
                }
                plans = navMembershipParser.instance().getConfig("plans",[]); 
                membershipPlans =  navMembershipParser.instance().getConfig("membership",[]); 
                deferred.resolve();
            },(error) => {
                deferred.reject(error);
            });
    
    }

    getOrderDetails(req, res, next){
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        var user = req.user;
        deferred.promise
            .done(function(orders){
		for(var i = 0; i < orders.length; i++) {
		    orders[i].delivery_date = new navCommonUtil().getDateString(parseInt(orders[i].delivery_date));
		    orders[i].returned_date = new navCommonUtil().getDateString(parseInt(orders[i].returned_date));
		    orders[i].lease_start_date = new navCommonUtil().getDateString(parseInt(orders[i].lease_start_date));
		}
                res.render("orderDetails",{
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    orders : orders,		    helpers : {
			getClass : function(status, options) {
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
        return new navRentalsDAO().getAllOrders(user._id)
            .done((_orders) => {

                deferred.resolve(_orders);
            },(error) => {
                deferred.reject(error);
            });
    
    }

}
