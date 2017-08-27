var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    navOrders = require(process.cwd() + "/lib/navOrders.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
    Q = require('q'),
    navPaymentFailureException = require(process.cwd() + "/lib/exceptions/navPaymentFailureException.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    moment = require('moment'),
    navPGCommunicator = require(process.cwd() + "/lib/navPGCommunicator.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js");

module.exports = class navPayments{
    constructor(client) {
        if(client) {
            this.client = client;
        }
    }

    updatePayment(paymentId, fields) {
        var p = new navPaymentsDAO(), promise = Q.resolve(), self = this, toyDetail, walletDetail, isRental = false;
        //TODO : Even if cash transaction we do not need to do rollback
        /*if((fields.type == p.TRANSACTION_TYPE.CASH || fields.type == p.TRANSACTION_TYPE.QR_BHIM || fields.type == p.TRANSACTION_TYPE.QR_PAYTM || fields.type == p.TRANSACTION_TYPE.TRANSFER )  && fields.paymentStatus === p.STATUS.CANCELLED) {
            navLogUtil.instance().log.call(self, self.updatePayment.name, "Rollbacking cash transaction " , "info");
            promise = new navAccount(self.client).rollbackTransaction(fields);
        }*/
        if((fields.type == p.TRANSACTION_TYPE.CASH || fields.type == p.TRANSACTION_TYPE.QR_BHIM || fields.type == p.TRANSACTION_TYPE.QR_PAYTM || fields.type == p.TRANSACTION_TYPE.TRANSFER )  && fields.paymentStatus === p.STATUS.COMPLETED_CASH) {
            navLogUtil.instance().log.call(self, self.updatePayment.name, "Marking cash transaction as success " , "info");
            promise = new navAccount(self.client).transactionSuccess({
                user_id : fields.userId,
                amount_payable : fields.amount,
                reason : fields.reason
            })
                .then(() => {
                    switch(fields.reason) {
                        case navPaymentsDAO.getReason().DEPOSIT_RETURN :
                        case navPaymentsDAO.getReason().DEPOSIT :
                        case navPaymentsDAO.getReason().REGISTRATION:
                        case navPaymentsDAO.getReason().DEPOSIT_TRANSFER:
                        case navPaymentsDAO.getReason().BALANCE_TRANSFER:
                            return Q.resolve();
                        default :   
                            isRental = true;
                    }
                    return new navOrders(self.client).getToyDetail(fields.transactionId);
                })
                .then((_toyDetail) => {
                    if(isRental) {
                        toyDetail = _toyDetail;
                        return new navAccount(self.client).getWalletDetails(fields.userId);
                    } else {
                        return Q.resolve()
                    }
                })
                .then((walletDetails) => {
                    if(isRental) {
                        if(walletDetails.length === 0) {
                            return Q.reject(new Error("Wallet details not found"));
                        }
                        walletDetail = walletDetails[0];
                        return new navAccount(self.client).rentToy(fields.userId, walletDetail, toyDetail);
                    } else {
                        return Q.resolve();
                    }

                })
        }
        return promise
            .then(() => {
                //navLogUtil.instance().log.call(self, self.updatePayment.name, "Marking membership as expired as transaction is cancelled" , "debug");
                return new navPaymentsDAO(self.client).updatePaymentById(paymentId, fields.paymentStatus, navCommonUtil.getTimeinMillis(fields.retryDate),navCommonUtil.getTimeinMillis(fields.expirationDate));
            })
        .catch((error) => {
            navLogUtil.instance().log.call(self, self.updatePayment.name, `Error occured , Error : ${error}` , "error");
            return Q.reject(error); 
        })
    }

    success(transactionId, code, status, message, isCash, isQR) {
        var p = new navPaymentsDAO(), self = this, promise, isOrder, userId, walletDetail;
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
            isOrder = transactions[0].is_order;
            userId = transactions[0].user_id;
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
                } else if(isQR) {
                    return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().PENDING_QR, new Date().getTime(), null, null);
                } else {
                    return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().COMPLETED, new Date().getTime(), null, null);
                }
            }
            return Q.resolve();
        })
        .then((result) => {
            var toyDetail;
            if(result && isOrder) {
                return new navOrders(self.client).getToyDetail(transactionId)
                .then((_toyDetail) => {
                    toyDetail = _toyDetail;
                    return new navAccount(self.client).getWalletDetails(userId)
                })
                .then((walletDetails) => {
                    if(walletDetails.length === 0) {
                        return Q.reject(new Error("Wallet details not found"));
                    }
                    walletDetail = walletDetails[0];
                    return new navAccount(self.client).rentToy(userId, walletDetail, toyDetail);
                })
                //return new navOrders(p.providedClient).completeOrder(transactionId, "success")
            } else {
                return Q.resolve();
            }
        })
        .then(() => {
            if(self.client) {
                return Q.resolve();
            } else {
                return p.commitTx();
            }
        })
        .catch(function (error) {
            //logg error
            var promise;
            if(self.client) {
                promise = Q.resolve();
            } else {
                promise = p.rollBackTx();
            }
            return promise 
                .then(() => {
                    return self.failure(transactionId, error.code, error.message, error.status);
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
            if(!self.client) {
                if (p.providedClient) {
                    p.providedClient.release();
                    p.providedClient = undefined;
                }
            }
        })

    }

    failure(transactionId, code, status, message) {
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
                return p.updatePaymentDetails(transactionId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().FAILED, new Date().getTime());
            })
            .then(() => {
                return new navOrders(self.client).completeOrder(transactionId, "failure")
            })
            .then(() => {

                if(self.client) {
                    return Q.resolve();
                } else {
                    return p.commitTx();
                }
            })
            .then(() => {
                return Q.reject(new navPaymentFailureException());
            })
            .catch(function (error) {
                //logg error
                if(self.client) {
                    return Q.reject(error);
                }
                return p.rollBackTx()
                    .then(function () {
                        navLogUtil.instance().log.call(self, self.failure.name,'Error while doing payment' + error, "error");
                        return Q.reject(error);
                        //res.status(500).send("Internal Server Error");
                    })
                    .catch(function (err) {
                        navLogUtil.instance().log.call(self, self.failure.name,'Error while doing payment' + err, "error");
                        //log error
                        return Q.reject(err);
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

    doPayments(transactionId, userId, transactions, paymentMethod, baseUrl, isOrder, needTransaction) {
       //for each recharge insert entry
       //calculate amount
       //act according to payment method and return path if it is paytm 
       if(paymentMethod !== "cash" && paymentMethod !== "paytm" && paymentMethod !== "transfer" && paymentMethod !== "paytm_qr" && paymentMethod !== "bhim_qr") {
           return Q.reject(new Error("Undefined payment method"));
       }
       var pDAO = new navPaymentsDAO(this.client);
       //var self = this;
       var promises = [], amount = 0;
        for(var i = 0; i < transactions.length; i++) {
            amount += transactions[i].amount;
            if(paymentMethod === "cash") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING_COD, transactionId, pDAO.TRANSACTION_TYPE.CASH, isOrder));      
            } else if(paymentMethod === "paytm_qr") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING_QR, transactionId, pDAO.TRANSACTION_TYPE.QR_PAYTM, isOrder));       
            } else if(paymentMethod === "bhim_qr") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING_QR, transactionId, pDAO.TRANSACTION_TYPE.QR_BHIM, isOrder));       
            } else if(paymentMethod === "paytm") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING, transactionId, pDAO.TRANSACTION_TYPE.PAYTM, isOrder));       
            } else if(paymentMethod === "transfer") {
                promises.push(pDAO.insertPaymentDetails(userId, transactions[i].amount , transactions[i].reason, pDAO.STATUS.PENDING, transactionId, pDAO.TRANSACTION_TYPE.TRANSFER, isOrder));       
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
                    //return self.success(transactionId, "TXN_SUCCESS", "0", "Cash on Delivery", true, false);
                } else if(paymentMethod === "paytm_qr" || paymentMethod === "bhim_qr") {
                    //return self.success(transactionId, "TXN_SUCCESS", "0", "Cash on Delivery", true, true);
                } else if(paymentMethod === "paytm") {
                    return navPGCommunicator.initiate(userId, amount + "", transactionId, baseUrl);
                } else if((paymentMethod === "transfer" && !needTransaction)){
                    //return self.success(transactionId, "TXN_SUCCESS", "0", "Transferred", false, false);
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
                    if(_transactions[i].status === navPaymentsDAO.getStatus().COMPLETED_CASH) {
                        transactions.push(navTransactions.createObject(_transactions[i], navTransactions.getType().PAYMENTS)); 
                    }
                }
                return Q.resolve(transactions)
            })
            .catch((error) => {
                return Q.reject(error);
            })
    }

    cancel(transactionId) {
       var self = this;
       return new navPaymentsDAO(self.client).getPaymentsByTransactionId(transactionId)
       .then((payments) => {
            var promises = [];
            for(var i = 0; i < payments.length; i++) {
                //TODO : check what to do if gateway transaction gets cancelled
                if(payments[i].status === navPaymentsDAO.getStatus().PENDING_COD) {
                    payments[i].paymentStatus = navPaymentsDAO.getStatus().CANCELLED;
                    payments[i].type = payments[i].transaction_type;
                    promises.push(self.updatePayment(payments[i]._id, payments[i]));
                }
            }
           return Q.allSettled(promises);
       })
        .then((results) => {
            for(var i = 0;  i < results.length; i++) {
                if(results[i].state === "rejected") {
                    return Q.reject(results[i].reason);
                }
            }
            return Q.resolve();
        })
        .catch((error) => {
            return Q.reject(error);
        })
    }


}

/**
 *  
 *
 *
 *
 *
 */
