var navPaymentisDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navPGFailureException = require(process.cwd() + "/lib/exceptions/navPGFailureException.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js");


module.exports = class navPGHelper {
    paymentSuccessHandler(req, res, response) {
        var dveferred = Q.defer(), self = this;
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
	new navPaymentsDAO.updatePaymentDetails(response.orderId,response.code + "::" +response.status +"::"+response.message, navPaymentsDAO.getStatus().COMPLETED)
	    .done(function(){
		deferred.resolve();
	    },(error) => {
		deferred.reject(error);
	    });

    }
    paymentFailureHandler(req, res, error) {
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
	new navPaymentsDAO.updatePaymentDetails(response.orderId,response.code + "::" +response.status +"::"+response.message, navPaymentsDAO.getStatus().FAILED)
	    .done(function(){
		deferred.reject(new navPGFailureException());
	    },(error) => {
		deferred.reject(error);
	    });
    }
}
