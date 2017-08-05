var navPaytm = require(process.cwd() + "/thirdparty/pg/paytm/checksum/checksum.js"),
    Q = require('q'),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navRequester = require(process.cwd() + "/lib/navRequester.js"),
    navPaytm = require(process.cwd() + "/thirdparty/pg/paytm/checksum/checksum.js"),
    navConfigParser = require(process.cwd() + '/lib/navConfigParser.js');
var gatewayDetails = {};

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
    name : "navPGCommunicator"
}
module.exports = class navPGCommunicator {
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
    static checkStatus(orderId) {
        var deferred = Q.defer();
        var requestData = {};
        requestData.ORDER_ID = orderId;      
        requestData.MID = gatewayDetails.merchantId;
        var response;
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
                    //var promise;
                    return Q.resolve(response);
                    /*if(response.code == "01" && response.status == GATEWAY_STATUS.SUCCESS) {
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
                    return promise;*/
                } else {
                    navLogUtil.instance().log.call(that, "checkStatus", "Unknown Error Occured,  Response : " + _response , "error");
                    return Q.reject(new Error(_response.body));
                   //return helper.processFailure(orderId, 500, 500, "Internal Error");
                }
            },(error) => {
                    navLogUtil.instance().log.call(that, "checkStatus", "Unknown Error Occured,  Error : " + error , "error");
                    return Q.reject(error);

//                   return helper.processFailure(orderId, 500, 500, "Internal Server Error")
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
