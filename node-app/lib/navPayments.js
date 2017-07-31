var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    Q = require('q'),
    navPaymentFailureException = require(process.cwd() + "/lib/exceptions/navPaymentFailureException.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    moment = require('moment'),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js");

module.exports = class navPayments{
    constructor(client) {
        if(client) {
            this.client = client;
        }
    }

    updatePayment(paymentId, fields) {
        var p = new navPaymentsDAO(), promise = Q.resolve(), self = this;
        if(fields.type == p.TRANSACTION_TYPE.CASH && fields.paymentStatus === p.STATUS.CANCELLED) {
            navLogUtil.instance().log.call(self, self.updatePayment.name, "Rollbacking cash transaction " , "info");
            promise = new navAccount().rollbackTransaction(fields);
        }
        return promise
            .then(() => {
                navLogUtil.instance().log.call(self, self.updatePayment.name, "Marking membership as expired as transaction is cancelled" , "debug");
                return new navPaymentsDAO().updatePaymentById(paymentId, fields.paymentStatus, navCommonUtil.getTimeinMillis(fields.retryDate),navCommonUtil.getTimeinMillis(fields.expirationDate));
            })
        .catch((error) => {
            navLogUtil.instance().log.call(self, self.updatePayment.name, `Error occured , Error : ${error}` , "error");
            return Q.reject(error); 
        })
    }

    success(transactionId, code, status, message, isCash) {
        var p = new navPaymentsDAO(), self = this, promise;
        if(this.client) {
            promise = Q.resolve(this.client);
        } else {
            promise = p.getClient();

        }
        return promise
            .then((_client) => {
                p.providedClient = _client;
                return p.startTx();
            })
        .then(() => {
            return p.getPaymentsByTransactionId(transactionId);
        })
        .then(function(transactions){
            var promises = [];
            if(transactions.length === 0) {
                navLogUtil.instance().log.call(self, self.success.name, `No transaction for id : ${transactionId}` , "error");
                //promises.push(Q.reject(new navPaymentFailureException()));
                return Q.allSettled(promises);
            }
            for(var i = 0; i < transactions.length; i++) {
                promises.push(new navAccount(p.providedClient).transactionSuccess(transactions[i]));
            }
            return Q.allSettled(promises);

        })
        .then((results) => {
            for(var i=0; i < results.length; i++) {
                if(results[i].state == 'rejected') {
                    return Q.reject(results[i].reason);
                }
            }
            if(results.length !== 0) {
                if(isCash) {
                return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().PENDING_COD, new Date().getTime(), null, null);
                } else {
                return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().COMPLETED, new Date().getTime(), null, null);
                }
            }
            return Q.resolve();
        })
        .then((_result) => {
            return p.commitTx();
        })
        .catch(function (error) {
            //logg error
            return p.rollBackTx()
            .then(function() {
                return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().TRANSACTION_FAILED, null, null, null); 
            })
            .then(function () {
                navLogUtil.instance().log.call(self, self.success.name,'Error while doing payment' + error, "error");
                return Q.reject(error);
                //res.status(500).send("Internal Server Error");
            })
            .catch(function (err) {
                navLogUtil.instance().log.call(self, self.success.name,'Error while doing payment' + err, "error");
                //log error
                return Q.reject(err)
            });
        })
        .finally(function () {
            if (p.providedClient) {
                p.providedClient.release();
                p.providedClient = undefined;
            }
        })

    }

    failure(transactionId, code, status, message) {
        const self = this;
        return new navPaymentsDAO().updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().FAILED, new Date().getTime())
            .then(() => {
                return Q.reject(new navPaymentFailureException());
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.failure.name,'Error while doing payment' + error, "error");
                return Q.reject(error);
            })
    }
    partialSuccess(transactionId, code, status, message) {
        const self = this;
        return new navPaymentsDAO().updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().PENDING, new Date().getTime(), moment().add(navConfigParser.instance().getConfig("PaymentGateway").RetryInterval, "hours").valueOf(), moment().add(navConfigParser.instance().getConfig("PaymentGateway").ExpirationInterval, "hours").valueOf() )
            .then(() => {
                return Q.reject(new navPaymentFailureException());
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.partialSuccess.name,'Error while doing payment' + error, "error");
                return Q.reject(error);
            })
    }
}
