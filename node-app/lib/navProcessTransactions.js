var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navPGHelper = require(process.cwd() + "/lib/navPGHelper.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    moment = require('moment'),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');

module.exports = class navProcessTransactions {
    constructor() {
    }

    processPendingTransactions() {
        var self = this; 
        return new navPaymentsDAO().markExpiredTransactionAsFailed()
            .then(() => {
                return new navPaymentsDAO().getNextPendingTransaction();
            })
            .then(function(transactionDetails){
                navLogUtil.instance().log.call(self, self.processPendingTransactions.name,`Got ${transactionDetails.length} transactions for processing` ,"info");
                debugger;
                if(transactionDetails.length !== 0) {
                    return new navPGHelper().handlePaymentResponse({ 
                        orderId : transactionDetails[0].transaction_id
                    })
                        .then((result) => {
                            if(result.isSuccess && !result.isPartial) {
                                return new navPayments().success(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                            } else if(result.isSuccess && result.isPartial) {
                                return new navPayments().partialSuccess(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                            } else {
                                return new navPayments().failure(result.orderId, result.gatewayCode, result.gatewayStatus, result.gatewayMessage)
                            }

                        })
                        .catch((error) => {
                            navLogUtil.instance().log.call(self, self.processPendingTransactions.name,`Error ${error} Occured` ,"error");
                            return new navPayments().updatePayment(transactionDetails[0].transaction_id,{
                                retryDate :  moment().add(navConfigParser.instance().getConfig("PaymentGateway").RetryInterval, "hours").valueOf()
                            })
                        })
                }
                else {
                    return Q.resolve();
                } 
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, "processPendingTransactions","Error : " + error, "error");
                return Q.resolve();
            })
    }
}
