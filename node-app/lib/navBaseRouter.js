var navResponseUtil = require(process.cwd() + '/lib/navResponseUtil.js'),
    express = require('express'); 

module.exports = class navBaseRouter {
    constructor() {
        this.router = express.Router();
    }

    getRouter() {
        return this.router;
    }

    ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            next();
            return;
        }
        // Redirect if not authenticated
        if(req.xhr) {
            new navResponseUtil.redirect(req, res, "/login"); 
        }else {
            return res.render('login',{
                layout: 'nav_bar_layout',
                hideNavBar : true
            });
        }
    }
    ensureVerified(req, res, next) {
        if (req.user == undefined || (req.user && req.user.email_verification == null)  ) {
            return next();
        }
        // Redirect if not authenticated
        if(req.xhr) {
            new navResponseUtil.redirect(req, res, "/"); 
        } else {
            res.render('completeRegistration',{
                isLoggedIn : true,
                layout : 'nav_bar_layout'
            });
        }
    }
    isSessionAvailable(req, res, next) {
        var userDetails = req.user;
        if (userDetails && userDetails._id) {
            next();
        } else {
            new navResponseUtil().redirect("/login");
        }
    }
}
