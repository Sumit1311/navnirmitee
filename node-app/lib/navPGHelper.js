var navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js");
    
    
    



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


