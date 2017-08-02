var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navPGHelper = require(process.cwd() + "/lib/navPGHelper.js"),
    navRequester = require(process.cwd() + "/lib/navRequester.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    LogicalException = require('node-exceptions').LogicalException,
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navPaytm = require(process.cwd() + "/thirdparty/pg/paytm/checksum/checksum.js"),
    Q = require('q'),
    navConfigParser = require(process.cwd() + '/lib/navConfigParser.js');
var gatewayDetails = {};
var GATEWAY_STATUS = {
    SUCCESS : "TXN_SUCCESS",
    FAILED : "TXN_FAILURE",
    PENDING : "PENDING",
    OPEN : "OPEN"
}

var PaymentGateway = navConfigParser.instance().getConfig("PaymentGateway");
gatewayDetails.domain = PaymentGateway.Domain;
gatewayDetails.merchantId = PaymentGateway.MerchantID;
gatewayDetails.merchantKey = PaymentGateway.MerchantKey;
gatewayDetails.website = PaymentGateway.Website;
gatewayDetails.channelId = PaymentGateway.ChannelID;
gatewayDetails.industryType = PaymentGateway.IndustryType;
gatewayDetails.transactionURLPath = PaymentGateway.TransactionURLPath;
gatewayDetails.callbackURL = PaymentGateway.CallbackURLPath;
gatewayDetails.statusAPIPath = PaymentGateway.StatusAPIPath;

var that = {
    name : "navPGRouter"
}

module.exports = class navPGRouter extends navBaseRouter {

     constructor() {
         super();
	
     }
     setup() {
	//this.router.use(this.isSessionAvailable, this.ensureAuthenticated, this.ensureVerfifed);
	//this.router.get("/initiate", this.initiatePayment.bind(this))
         this.router.post(gatewayDetails.callbackURL, this.callback.bind(this));	
         return this;
     }

    callback(req, res) {
        var body =req.body;
        var paymentStatus = navPaytm.verifychecksum(body, gatewayDetails.merchantKey);
        var helper =new navPGHelper();
        var intResponse = {
            code : body.RESPCODE,
            message : body.RESPMSG,
            status : body.STATUS,
            transactionAmount : body.TXNAMOUNT,
            orderId : body.ORDERID
        }
        var self = this;

        var deferred = Q.defer();

        deferred.promise
        .done((isPartial) => {
            if(!isPartial) {
                res.render("pg/paymentSuccess", {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
                })	
            } else {
                res.render("pg/paymentPending", {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
                })	
            
            }
        },(error) => {
            var respUtil =  new navResponseUtil();
            var response = respUtil.generateErrorResponse(error);
            respUtil.renderErrorPage(req, res, {
                errorResponse : response,
                user : req.user,
                isLoggedIn : false,
                layout : 'nav_bar_layout',

            });
        
        })

        if(paymentStatus && intResponse.orderId) {
            helper.handlePaymentResponse(intResponse)
            .then((result) => {
                if(result.isSuccess && !result.isPartial) {
                    return new navPayments().success(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                       .then(() =>{
                            deferred.resolve(false);
                       })
                } else if(result.isSuccess && result.isPartial) {
                    return new navPayments().partialSuccess(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                       .then(() =>{
                            deferred.resolve(true);
                       })
                } else {
                    return new navPayments().failure(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                       .then(() =>{
                            deferred.reject(result);
                       })
                }
            
            })
            .catch((error) => {
                deferred.reject(error);
            })
            /*navLogUtil.instance().log.call(self, self.callback.name, "Initial Payment successful for transaction Id :"+intResponse.orderId, "info");
            navPGCommunicator.checkStatus(intResponse.orderId)
                .done((response) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Payment successful for transaction Id :"+intResponse.orderId + ", for amount : "+ intResponse.transactionAmount, "info");

                    helper.paymentSuccessHandler(req, res, response);
                }, (error) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Payment failure for transaction Id :"+intResponse.orderId + ", for amount : "+ intResponse.transactionAmount + ", Response : " + intResponse + "Error : "+error, "error");
                    helper.paymentFailureHandler(req, res, error); 
                })*/
        }
        else {
            deferred.reject(new LogicalException("Checksum Mismatch"));
            /*if(intResponse.orderId) {
                navLogUtil.instance().log.call(self, self.callback.name, "Error body tempred "+intResponse, "error");
                promise = helper.processFailure(intResponse.orderId, intResponse.code, intResponse.status, intResponse.message);
            }
            promise
                .done(null, (error) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Error body tempred "+intResponse, "error");
                    helper.paymentFailureHandler(req, res, error); 
                })*/
        }

    }

}
