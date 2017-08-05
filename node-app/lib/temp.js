var express = require('express'),
    router = express.Router();


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
