var    navPGCommunicator = require(process.cwd() + "/lib/navPGCommunicator.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');
    
var GATEWAY_STATUS = {
    SUCCESS : "TXN_SUCCESS",
    FAILED : "TXN_FAILURE",
    PENDING : "PENDING",
    OPEN : "OPEN"
}
    



module.exports = class navPGHelper {
    handlePaymentResponse(response) {
        var self = this;
        navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Initial Payment successful for transaction Id :"+response.orderId, "info");
        return navPGCommunicator.checkStatus(response.orderId)
            .then((_response) => {
                navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Payment successful for transaction Id " + response.orderId + ", for amount : "+ _response.transactionAmount, "info");
                    if(_response.code == "01" && _response.status == GATEWAY_STATUS.SUCCESS) {
                        navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Payment for TransactionId :"+_response.orderId+" Succeded", "info");
                        return Q.resolve({ 
                            orderId : _response.orderId, 
                            gatewayCode : _response.code,
                            gatewayStatus : _response.status, 
                            gatewayMessage : _response.message,
                            isSuccess : true,
                            isPartial : false
                        });
                    }
                    else if((_response.status == GATEWAY_STATUS.PENDING || _response.status == GATEWAY_STATUS.OPEN)) {
                        navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Payment for TransactionId :"+_response.orderId+" is pending", "info");
                        return Q.resolve({ 
                            orderId : _response.orderId, 
                            gatewayCode : _response.code,
                            gatewayStatus : _response.status, 
                            gatewayMessage : _response.message,
                            isSuccess : true,
                            isPartial : true
                        });
                        //promise = helper.processPartialSuccess(response.orderId, response.code, response.status, response.message);
                    }
                    else {
                        navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Payment for TransactionId :"+_response.orderId+" is failed with response : " + JSON.stringify(_response) , "error");
                        return Q.resolve({ 
                            orderId : _response.orderId, 
                            gatewayCode : _response.code,
                            gatewayStatus : _response.status, 
                            gatewayMessage : _response.message,
                            isSuccess : false
                        });
                        //promise = helper.processFailure(response.orderId, response.code, response.status, response.message);
                    }

                //.paymentSuccessHandler(req, res, response);
            }, (error) => {
                navLogUtil.instance().log.call(self, self.handlePaymentResponse.name, "Payment failure for transaction Id :"+response.orderId + ", for amount : "+ response.transactionAmount + ", Response : " + response + "Error : "+error, "error");
                return Q.reject(error);
                //helper.paymentFailureHandler(req, res, error); 
            })
        
    } 
}


