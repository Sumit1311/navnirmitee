var express = require('express'),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js");
var router = express.Router(),
    url = require("url"),
    Q = require('q'),
    moment = require('moment'),
    UserDAO = require(process.cwd() + "/dao/user/masterDAO.js");


router.get('/contact', function (req, res) {
    res.render('contact', {
        user : req.user,
        layout : false
    });

});
router.get('/pricing', function (req, res) {
    res.render('pricing', {
        user : req.user,
        layout : false
    });

});
router.get('/order', function (req, res) {
        res.render('order', {
                    user : req.user,
                    layout : false
                });

});

router.get('/profile', function (req, res) {
    res.render('profile', {
        user : req.user,
        layout : false
    });

});
router.get('/about', function (req, res) {
    res.render('about', {
        user : req.user,
        layout : false
    });

});
router.get('/single', function (req, res) {
    res.render('single', {
        user : req.user,
    layout : false
    });

});
router.get('/single2', function (req, res) {
    res.render('single2', {
        user : req.user,
    layout : false
    });

});
router.get('/blog', function (req, res) {
    res.render('blog', {
        user : req.user,
    layout : false
    });

});
router.get('/blog2', function (req, res) {
    res.render('blog2', {
        user : req.user,
    layout : false
    });

});
router.get('/product', function (req, res) {
    res.render('product', {
        user : req.user,
    layout : false
    });

});
router.get('/detail', function (req, res) {
    res.render('detail', {
        user : req.user,
    layout : false
    });

});
router.get('/confirm', function (req, res) {
    res.render('confirm', {
        user : req.user,
    layout : false
    });

});
router.get('/testimoni', function (req, res) {
        res.render('testimoni', {
                    user : req.user,
                layout : false
                });

});

module.exports = router;
