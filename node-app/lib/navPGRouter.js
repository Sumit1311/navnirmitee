var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navPGHelper = require(process.cwd() + "/lib/navPGHelper.js"),
    navRequester = require(process.cwd() + "/lib/navRequester.js"),
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
gatewayDetails['domain'] = PaymentGateway.Domain;
gatewayDetails['merchantId'] = PaymentGateway.MerchantID;
gatewayDetails['merchantKey'] = PaymentGateway.MerchantKey;
gatewayDetails['website'] = PaymentGateway.Website;
gatewayDetails['channelId'] = PaymentGateway.ChannelID;
gatewayDetails['industryType'] = PaymentGateway.IndustryType;
gatewayDetails["transactionURLPath"] = PaymentGateway.TransactionURLPath;
gatewayDetails["callbackURL"] = PaymentGateway.CallbackURLPath;
gatewayDetails["statusAPIPath"] = PaymentGateway.StatusAPIPath;

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
	requestData["ORDER_ID"] = orderId;		
	requestData["CUST_ID"] = userId;		
	requestData["INDUSTRY_TYPE_ID"] = gatewayDetails['industryType'];		
	requestData["CHANNEL_ID"] = gatewayDetails['channelId'];		
	requestData["TXN_AMOUNT"] = amount;		
	requestData["MID"] = gatewayDetails.merchantId;
	requestData["WEBSITE"] = gatewayDetails.website;
    if(urlObj) {
        urlObj.pathname = "/pg" + gatewayDetails.callbackURL;
        //console.log(urlObj.format());
        requestData["CALLBACK_URL"] = urlObj.format(); 
    }
	navPaytm.genchecksum(requestData, gatewayDetails.merchantKey, function(err, result){
	    if(err) {
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
        navPGRouter.checkStatus(intResponse.orderId)
            .done((response) => {
                if(paymentStatus && response.code == "01" && response.status == GATEWAY_STATUS.SUCCESS) {
                    helper.paymentSuccessHandler(req, res, response)
                }
                else if(paymentStatus && (response.status == GATEWAY_STATUS.PENDING || response.status == GATEWAY_STATUS.OPEN)) {
                    helper.paymentPartialSuccessHandler(req, res, response);
                }
                else {
                    helper.paymentFailureHandler(req, res, response);
                }
            }, (error) => {
                    helper.handleServerError(req, res, error); 
            })
    }

    static checkStatus(orderId) {
        var deferred = Q.defer();
        var requestData = {};
        requestData["ORDER_ID"] = orderId;      
        requestData["MID"] = gatewayDetails.merchantId;
        var response;
        var paymentStatus;
        navPaytm.genchecksum(requestData, gatewayDetails.merchantKey, function(err, result){
            if(err) {
                return deferred.reject(err);
            }
            //require('request').debug = true;

            new navRequester().setHref(gatewayDetails.domain + gatewayDetails.statusAPIPath).doRequest({
                body : {JsonData : JSON.stringify(result)}
            })
            .then((_response) => {
                var body = _response.body
                var helper =new navPGHelper();
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
                        promise = helper.processSuccess(response.orderId, null, response.status, response.message);
                    }
                    else if((response.status == GATEWAY_STATUS.PENDING || response.status == GATEWAY_STATUS.OPEN)) {
                        promise = helper.processPartialSuccess(response.orderId, null, response.status, response.message);
                    }
                    else {
                        promise = helper.processFailure(response.orderId, null, response.status, response.message);
                    }
                    return promise;
                } else {
                   return helper.paymentFailureHandler(orderId, 500, 500, "Internal Error");
                }
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
