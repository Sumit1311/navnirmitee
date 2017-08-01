var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
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
                if(self.client) {
                    return Q.resolve();
                } else {
                    return p.startTx();
                }
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
                if(self.client) {
                    return Q.resolve();
                } else {
                    return p.commitTx();
                }
        })
        .catch(function (error) {
            //logg error
            if(self.client) {
                return Q.reject(error);
            }
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
            if(self.client) {
                return ;
            }
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

    doPayments(transactionId, userId, transactions, paymentMethod, baseUrl) {
       //for each recharge insert entry
       //calculate amount
       //act according to payment method and return path if it is paytm 
       if(paymentMethod !== "cash" && paymentMethod !== "paytm") {
           return Q.reject(new Error("Undefined payment method"));
       }
       var pDAO = new navPaymentsDAO(this.client);
       var self = this;
       var promises = [], amount = 0;
        for(var i = 0; i < transactions.length; i++) {
            amount += transactions[i].amount;
            if(paymentMethod === "cash") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING_COD, transactionId, pDAO.TRANSACTION_TYPE.CASH));       
            } else if(paymentMethod === "paytm") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING, transactionId, pDAO.TRANSACTION_TYPE.PAYTM));       
            }
        }

        return Q.allSettled(promises)
            .then((results) => {
                for(var i=0; i < results.length; i++) {
                    if(results[i].state == 'rejected') {
                        return Q.reject(results[i].reason);
                    }
                }
                if(paymentMethod === "cash") {
                    return self.success(transactionId, "TXN_SUCCESS", "0", "Cash on Delivery", true);
                } else if(paymentMethod === "paytm") {
                    return require(process.cwd() + "/lib/navPGRouter.js").initiate(userId, amount + "", transactionId, baseUrl);
                } else {
                    return Q.resolve();
                }
            })
            .catch((error) => {
               return Q.reject(error);  
            })
    }

    getPaymentsList(offset, limit, sorters) {
        var paymentList, statusList, noOfOrders = 0, noOfPages;
        return new navPaymentsDAO().getPaymentsCount()
            .then((_paymentCount) => {
                noOfOrders = parseInt(_paymentCount[0].count);

                if(noOfOrders % limit !== 0 ) {
                    noOfPages = Math.floor(noOfOrders / limit) + 1;
                } else {
                    noOfPages = Math.floor(noOfOrders / limit) ;
                }
                return new navPaymentsDAO().getPaymentsFullList(offset, limit, sorters[0].column, sorters[0].type);
            } )
            .then((_rentals) => {
                paymentList = _rentals;
                for(var i in paymentList) {
                    if(paymentList.hasOwnProperty(i)) {
                        paymentList[i].credit_date = paymentList[i].delivery_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].credit_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].paid_date = paymentList[i].paid_date === null ? "" :new navCommonUtil().getDateString(parseInt(paymentList[i].paid_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].next_retry_date =paymentList[i].next_retry_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].next_retry_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].expiration_date =paymentList[i].expiration_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].expiration_date), "YYYY-MM-DDTHH:mm:ssZ");
                    }
                }
                var paymentStatus = navPaymentsDAO.getStatus();
                statusList = [];
                for(i in paymentStatus) {
                    if(paymentStatus.hasOwnProperty(i)) {
                        statusList.push(paymentStatus[i]);
                    }
                }
                return Q.resolve({
                    statusList : statusList,
                    paymentList : paymentList,
                    noOfPages : noOfPages
                });
            })
    }

    getPayments(userId) {
         return new navPaymentsDAO().getAllPaymentTransactions(userId)
            .then((_transactions) => {
                var transactions =[];
                for(var i = 0; i < _transactions.length; i++) {
                    transactions.push(navTransactions.createObject(_transactions[i], navTransactions.getType().PAYMENTS)); 
                }
                return Q.resolve(transactions)
            })
            .catch((error) => {
                return Q.reject(error);
            })
    }

}
