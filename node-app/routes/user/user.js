var express = require('express');
var router = express.Router(),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    passport = require('passport'),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

/*router.get('/home', function (req, res) {
    res.render('', {
        user: req.user
    });
});*/
module.exports = router;
