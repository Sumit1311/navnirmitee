var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPGFailureException = require(process.cwd() + "/lib/exceptions/navPGFailureException.js"),
    navTransactionPendingException = require(process.cwd() + "/lib/exceptions/navTransactionPendingException.js"),
    navPaymentFailureException = require(process.cwd() + "/lib/exceptions/navPaymentFailureException.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    moment = require('moment'),
    Q = require('q'),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js");



module.exports = class navPGHelper {
    paymentSuccessHandler(req, res, response) {
        res.render("pg/paymentSuccess", {
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout'
        })	

    }
    paymentFailureHandler(req, res, error) {
        var respUtil =  new navResponseUtil();
        var response = respUtil.generateErrorResponse(error);
        respUtil.renderErrorPage(req, res, {
            errorResponse : response,
            user : req.user,
            isLoggedIn : false,
            layout : 'nav_bar_layout',

        });
    }
    
    processSuccess(orderId, code, status, message) {
        var paymentDAO = new navPaymentsDAO(), userDAO, self = this;
        return paymentDAO.getClient()
            .then((_client) => {
                paymentDAO.providedClient = _client;
                return paymentDAO.startTx();
            })
        .then(() => {
            return paymentDAO.getPaymentsByTransactionId(orderId);
        })
        .then((transactions) => {
            var promises = [];
            if(transactions.length === 0) {
                //promises.push(Q.reject(new navPaymentFailureException()));
                return Q.allSettled(promises);
            }
            userDAO = new navUserDAO(paymentDAO.providedClient);
            for(var i = 0; i < transactions.length; i++) {
                console.log(transactions[i].user_id,transactions[i].amount_payable)
                switch(transactions[i].reason) {
                    case navPaymentsDAO.getReason().DEPOSIT :
                        promises.push(userDAO.updateDeposit(transactions[i].user_id,transactions[i].amount_payable));
                        break;
                    case navPaymentsDAO.getReason().REGISTRATION:
                        promises.push(userDAO.updateMembershipExpiry(transactions[i].user_id, null));
                        break;
                    default :   
                        promises.push(userDAO.updateBalance(transactions[i].user_id,transactions[i].amount_payable));
                        break;
                }
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
                return paymentDAO.updatePaymentDetails(orderId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().COMPLETED, new Date().getTime(), null, null);
            }
            return Q.resolve();

        })
        .then((_result) => {
            //result = _result;
            return paymentDAO.commitTx();
        })
        .catch(function (error) {
            //logg error
            navLogUtil.instance().log.call(self,'[/subscribePlan]', 'Error while doing payment' + error, "error");
            return paymentDAO.rollBackTx()
            .then(function() {
                return paymentDAO.updatePaymentDetails(orderId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().TRANSACTION_FAILED, null, null, null); 
            })
            .then(function () {
                return Q.reject(error);
                //res.status(500).send("Internal Server Error");
            })
            .catch(function (err) {
                //log error
                return Q.reject(err)
            });
        })
        .finally(function () {
            if (paymentDAO.providedClient) {
                paymentDAO.providedClient.release();
                paymentDAO.providedClient = undefined;
            }
        })

    }

    processFailure(orderId, code, status, message) {
        return new navPaymentsDAO().updatePaymentDetails(orderId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().FAILED, new Date().getTime())
            .then(() => {
                return Q.reject(new navPaymentFailureException());
            })
            .catch((error) => {
                return Q.reject(error);
            })
    }

    processPartialSuccess(orderId, code, status, message) {
        return new navPaymentsDAO().updatePaymentDetails(orderId,code + "::" +status +"::"+message, navPaymentsDAO.getStatus().PENDING, new Date().getTime(), moment().add(navConfigParser.instance().getConfig("PaymentGateway")["RetryInterval"], "hours").valueOf(), moment().add(navConfigParser.instance().getConfig("PaymentGateway")["ExpirationInterval"], "hours").valueOf() )
            .then(() => {
                return Q.reject(new navPaymentFailureException());
            })
            .catch((error) => {
                return Q.reject(error);
            })
    }


}


