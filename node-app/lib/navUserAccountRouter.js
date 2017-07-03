var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js'),
    navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    navCommonUtil = require(process.cwd() + '/lib/navCommonUtil.js'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
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
        this.router.get('/orderDetails', function(req,res, next) {self.doOrderDetails(req,res,next)}); 
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
                    if(parseInt(a.transactionDate) < parseInt(b.transactionDate)) {
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
                    membershipPlans : membershipPlans
                
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


}
