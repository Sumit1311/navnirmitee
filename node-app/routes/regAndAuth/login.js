/**
 * This file defines the routes for the login functionality
 * and all the routes are root path routes i.e.
 * will be accessed as http://<domain_name>/<route_name>
 */
var express = require('express');
var router = express.Router(),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    navToysDAO = require(process.cwd() + "/dao/toys/navToysDAO.js"),
    passport = require('passport'),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

router.get('/logout', navnirmiteeApi.util.ensureAuthenticated,
        navnirmiteeApi.util.isSessionAvailable,
        function (req, res) {
            req.session.destroy();
            res.redirect('/');
        });
router.get('/', function (req, res) {
    var promise = Q.resolve();
    if(!req.user)
    {
        promise = (new navToysDAO()).getAllToys(0,10);
    }
    else
    {
        promise = (new navToysDAO()).getAllToys(0,10);
    }
    promise.then(function(toysList){
        //console.log(toysList);
        res.render('index', {
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout',
            toysList : toysList
        });
    });
});
//the root path which should redirect authenticated users to there home page
/*router.get('/home',
    navnirmiteeApi.util.ensureAuthenticated,
    navnirmiteeApi.util.isSessionAvailable,
    function (req, res, next) {
        res.redirect('/');
    });*/

//root path which logs in the user to there account
router.post('/', passport.authenticate('local'), function (req, res) {
    return res.redirect('/');
});

//the path which will be used to login this is the route for displaying sign in page to user
router.get('/login', function (req, res) {
    //if the user is already authenticated i.e. exist in the session then continue to the home page
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        return res.render('login',{
            layout: 'nav_bar_layout',
            hideNavBar : true
        });
    }
});

router.get('/about', function (req, res) {
    res.render('about', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });
});
router.get('/contact', function (req, res) {
    res.render('contact', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });

});
router.get('/pricing', function (req, res) {
    res.render('pricing', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });

});
router.post('/register', function (req, res) {
    res.render('pricing', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });

});
module.exports = router;
