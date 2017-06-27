var express = require('express'); 

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
        return res.render('login',{
            layout: 'nav_bar_layout',
            hideNavBar : true
        });
    }
    ensureVerified(req, res, next) {
        if (req.user == undefined || (req.user && req.user.email_verification == null)  ) {
            return next();
        }
        // Redirect if not authenticated
        res.render('completeRegistration',{
            isLoggedIn : true,
            layout : 'nav_bar_layout'
        });
    }
    isSessionAvailable(req, res, next) {
        var userDetails = req.user;
        if (userDetails && userDetails._id) {
            next();
        } else {
            res.redirect("/login");
        }
    }
}
