var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navPGHelper = require(process.cwd() + "/lib/navPGHelper.js"),
    navRequester = require(process.cwd() + "/lib/navRequester.js"),
    LogicalException = require('node-exceptions').LogicalException,
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
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
     static initiate(userId, amount, orderId, urlObj) {
         var deferred = Q.defer();
         var requestData = {};
         requestData.ORDER_ID = orderId;		
         requestData.CUST_ID = userId;		
         requestData.INDUSTRY_TYPE_ID = gatewayDetails.industryType;		
         requestData.CHANNEL_ID = gatewayDetails.channelId;		
         requestData.TXN_AMOUNT = amount;		
         requestData.MID = gatewayDetails.merchantId;
         requestData.WEBSITE = gatewayDetails.website;
         if(urlObj) {
             urlObj.pathname = "/pg" + gatewayDetails.callbackURL;
             requestData.CALLBACK_URL = urlObj.format(); 
         }
         navLogUtil.instance().log.call(that,"initiate","Initiating Paytm Transaction for "+userId+", for transactionId :"+orderId,"info");
         navPaytm.genchecksum(requestData, gatewayDetails.merchantKey, function(err, result){
             if(err) {
                 navLogUtil.instance().call(that,"initiate","Error occured generating checksum : " + err,"error");

                 return deferred.reject(err);
             }
             return deferred.resolve({
                 pageToRender : "pg/redirect",
                 redirectURL : gatewayDetails.domain + gatewayDetails.transactionURLPath, 
                 context : result
             });
         });
         return deferred.promise;
    }

    callback(req, res) {
        var body =req.body;
        var paymentStatus = navPaytm.verifychecksum(body, gatewayDetails.merchantKey);
        var helper =new navPGHelper();
        var promise;
        var intResponse = {
            code : body.RESPCODE,
            message : body.RESPMSG,
            status : body.STATUS,
            transactionAmount : body.TXNAMOUNT,
            orderId : body.ORDERID
        }
        var self = this;
        if(paymentStatus && intResponse.orderId) {
            navLogUtil.instance().log.call(self, self.callback.name, "Initial Payment successful for transaction Id :"+intResponse.orderId, "info");
            navPGRouter.checkStatus(intResponse.orderId)
                .done((response) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Payment successful for transaction Id :"+intResponse.orderId + ", for amount : "+ intResponse.transactionAmount, "info");

                    helper.paymentSuccessHandler(req, res, response);
                }, (error) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Payment failure for transaction Id :"+intResponse.orderId + ", for amount : "+ intResponse.transactionAmount + ", Response : " + intResponse + "Error : "+error, "error");
                    helper.paymentFailureHandler(req, res, error); 
                })
        }
        else {
            promise = Q.reject(new LogicalException("Checksum Mismatch"));
            if(intResponse.orderId) {
                navLogUtil.instance().log.call(self, self.callback.name, "Error body tempred "+intResponse, "error");
                promise = helper.processFailure(intResponse.orderId, intResponse.code, intResponse.status, intResponse.message);
            }
            promise
                .done(null, (error) => {
                    navLogUtil.instance().log.call(self, self.callback.name, "Error body tempred "+intResponse, "error");
                    helper.paymentFailureHandler(req, res, error); 
                })
        }

    }

    static checkStatus(orderId) {
        var deferred = Q.defer();
        var requestData = {};
        requestData.ORDER_ID = orderId;      
        requestData.MID = gatewayDetails.merchantId;
        var response;
        var paymentStatus;
        var helper =new navPGHelper();
        navPaytm.genchecksum(requestData, gatewayDetails.merchantKey, function(err, result){
            if(err) {
                navLogUtil.instance().log.call(that,"checkStatus", "Error generating checksum : "+err, "error");
                return deferred.reject(err);
            }
            //require('request').debug = true;

            new navRequester().setHref(gatewayDetails.domain + gatewayDetails.statusAPIPath).doRequest({
                body : {JsonData : JSON.stringify(result)}
            })
            .then((_response) => {
                var body = _response.body
                if(_response.status == 200) {
                    body = JSON.parse(body);
                    if(body.ErrorCode) {
                        return Q.reject(new Error(body.ErrorMsg));
                    }
                    //paymentStatus = navPaytm.verifychecksum(body, gatewayDetails.merchantKey);
                    response = {
                        orderId : body.ORDERID,
                        amount : body.TXNAMOUNT,
                        status : body.STATUS,
                        message : body.RESPMSG,
                        code : body.RESPCODE
                    };
                    var promise;
                    if(response.code == "01" && response.status == GATEWAY_STATUS.SUCCESS) {
                        navLogUtil.instance().log.call(that, "checkStatus", "Payment for TransactionId :"+response.orderId+" Succeded", "info");
                        promise = helper.processSuccess(response.orderId, response.code, response.status, response.message);
                    }
                    else if((response.status == GATEWAY_STATUS.PENDING || response.status == GATEWAY_STATUS.OPEN)) {
                        navLogUtil.instance().log.call(that, "checkStatus", "Payment for TransactionId :"+response.orderId+" is pending", "info");
                        promise = helper.processPartialSuccess(response.orderId, response.code, response.status, response.message);
                    }
                    else {
                        navLogUtil.instance().log.call(that, "checkStatus", "Payment for TransactionId :"+response.orderId+" is failed with response : " + response , "error");
                        promise = helper.processFailure(response.orderId, response.code, response.status, response.message);
                    }
                    return promise;
                } else {
                    navLogUtil.instance().log.call(that, "checkStatus", "Unknown Error Occured,  Response : " + _response , "error");

                   return helper.processFailure(orderId, 500, 500, "Internal Error");
                }
            },(error) => {
                    navLogUtil.instance().log.call(that, "checkStatus", "Unknown Error Occured,  Error : " + error , "error");

                   return helper.processFailure(orderId, 500, 500, "Internal Server Error")
            })
            .done(() => {
                deferred.resolve(response);
            },(error) => {
                deferred.reject(error);
            })
        });
        return deferred.promise;

    }
}
