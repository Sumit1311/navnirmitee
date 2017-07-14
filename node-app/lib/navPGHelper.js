var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPGFailureException = require(process.cwd() + "/lib/exceptions/navPGFailureException.js"),
    navPaymentDoneException = require(process.cwd() + "/lib/exceptions/navPaymentDoneException.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    moment = require('moment'),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js");


module.exports = class navPGHelper {
    paymentSuccessHandler(req, res, response) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                res.render("pg/paymentSuccess", {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
                })	
                //respUtil.redirect(req, res, "/");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',

                });
            });
        var paymentDAO = new navPaymentsDAO(), userDAO;
        paymentDAO.getClient()
            .then((_client) => {
                paymentDAO.providedClient = _client;
                return paymentDAO.startTx();
            })
        .then(() => {
            return paymentDAO.getPaymentsByTransactionId(response.orderId);
        })
        .then((transactions) => {
            var promises = [];
            if(transactions.length == 0)
        {
            promisses.push(Q.reject(new navPaymentDoneException()));
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
                if(results[i].state == 'rejected')
            return Q,reject(results[i].reason);
            };

            return paymentDAO.updatePaymentDetails(response.orderId,response.code + "::" +response.status +"::"+response.message, navPaymentsDAO.getStatus().COMPLETED, new Date().getTime());

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
                return paymentDAO.updatePaymentDetails(response.orderId,response.code + "::" +response.status +"::"+response.message, navPaymentsDAO.getStatus().TRANSACTION_FAILED, new Date().getTime()); 
            })
        .then(function () {
            return Q.reject(error);
            //res.status(500).send("Internal Server Error");
        })
        .catch(function (err) {
            //log error
            return Q.reject(err)
        })
        })
        .finally(function () {
            if (paymentDAO.providedClient) {
                paymentDAO.providedClient.release();
                paymentDAO.providedClient = undefined;
            }
        })
        .done(function(){
            deferred.resolve();
        },(error) => {
            deferred.reject(error);
        });

    }
    paymentFailureHandler(req, res, response) {
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                res.render("pg/paymentFailure", {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
                })	
                //respUtil.redirect(req, res, "/");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',

                });
            });
        new navPaymentsDAO().updatePaymentDetails(response.orderId,response.code + "::" +response.status +"::"+response.message, navPaymentsDAO.getStatus().FAILED, new Date().getTime(), moment().add(navConfigParser.getConfig("PaymentGateway")["RetryInterval"], "hours").valueOf(), moment().add(navConfigParser.getConfig("PaymentGateway")["ExpirationInterval"], "hours").valueOf() )
            .done(function(){
                deferred.reject(new navPGFailureException());
            },(error) => {
                deferred.reject(error);
            });
    }
}
