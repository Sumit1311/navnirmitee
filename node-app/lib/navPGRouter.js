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
        var response = {
            code : body.RESPCODE,
            message : body.RESPMSG,
            status : body.STATUS,
            transactionAmount : body.TXNAMOUNT,
            orderId : body.ORDERID
        }	
        if(paymentStatus && response.code == "01" && response.status == GATEWAY_STATUS.SUCCESS) {
            helper.paymentSuccessHandler(req, res, response)
        }
        else {
            helper.paymentFailureHandler(req, res, response);
        }
    }

    static checkStatus(orderId) {
        var deferred = Q.defer();
        var requestData = {};
        requestData["ORDER_ID"] = orderId;      
        requestData["MID"] = gatewayDetails.merchantId;
        navPaytm.genchecksum(requestData, gatewayDetails.merchantKey, function(err, result){
            if(err) {
                return deferred.reject(err);
            }
            new navRequester().setHref(gatewayDetails.domain + gatewayDetails.statusAPIPath).doRequest({
                body : result
            })
            .then((body) => {
                var response = {
                    orderId : body.ORDERID,
                    amount : body.TXNAMOUNT,
                    status : body.STATUS,
                    message : body.RESPMSG
                };
                if(response.status == GATEWAY_STATUS.SUCCESS) {
                    deferred.resolve(response);
                }
                else {

                }
            })
            .catch((error) => {
                deferred.reject(error);
            })
            deferred.resolve({
                pageToRender : "pg/redirect",
                   redirectURL : gatewayDetails.domain + gatewayDetails.transactionURLPath, 
                   context : result
            });
        });
        return deferred.promise;

    }
}
