var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPGFailureException = require(process.cwd() + "/lib/exceptions/navPGFailureException.js"),
    navTransactionPendingException = require(process.cwd() + "/lib/exceptions/navTransactionPendingException.js"),
    navPaymentFailureException = require(process.cwd() + "/lib/exceptions/navPaymentFailureException.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
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
        return new navPayments().success(orderId, code, status, message);
    }

    processFailure(orderId, code, status, message) {
        return new navPayments().failure(orderId, code, status, message);
    }

    processPartialSuccess(orderId, code, status, message) {
        return new navPayments().partialSuccess(orderId, code, status, message);
                
    }


}


