/**
 * This file defines the routes for the login functionality
 * and all the routes are root path routes i.e.
 * will be accessed as http://<domain_name>/<route_name>
 */
var express = require('express');
var router = express.Router(),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    passport = require('passport'),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

//the root path which should redirect authenticated users to there home page
router.get('/',
    navnirmiteeApi.util.ensureAuthenticated,
    navnirmiteeApi.util.isSessionAvailable,
    function (req, res, next) {
        res.redirect('/user/home');
    });

//root path which logs in the user to there account
router.post('/', passport.authenticate('local'), function (req, res) {
    res.redirect('/user/home');
});

//the path which will be used to login this is the route for displaying sign in page to user
router.get('/login', function (req, res) {
    //if the user is already authenticated i.e. exist in the session then continue to the home page
    if (req.isAuthenticated()) {
        return res.redirect('/user/home');
    } else {
        return res.render('login');
    }
});

module.exports = router;