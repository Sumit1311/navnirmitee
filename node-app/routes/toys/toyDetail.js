var express = require('express');
var router = express.Router(),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    repeatHelper = require('handlebars-helper-repeat'),
    helpers = require('handlebars-helpers')(),
    passport = require('passport'),
    navToysDAO = require(process.cwd() + "/dao/toys/navToysDAO.js"),
    navUserDAO = require(process.cwd() + "/dao/user/userDAO.js"),
    navRentalsDAO = require(process.cwd() + "/dao/rentals/navRentalsDAO.js"),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

router.get('/detail', function (req, res) {
    var id = req.query.id, toy;
    (new navToysDAO()).getToyDetailById(id)
    .then(function(toyDetail){
        //i
        if(toyDetail.length == 0)
        {
            return Q.reject();
        }
        toy = toyDetail;
        return navnirmiteeApi.util.getNoOfFilesMatchPat(toyDetail[0]._id+'_*',process.cwd() + '/../public/img/toys/');
    })
    .then(function(result){
        //console.log(toy,repeatHelper);
        res.render('detail', {
            user: req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_bar_layout',
            toyDetail : toy[0],
            imageCount : result,
            helpers : {
                repeat : repeatHelper,
                helper : helpers
            }
        });

    })
    .catch(function(err){
        console.log(err); 
        return Q.reject(err);
    })

});
router.get('/order', function (req, res) {
    var id = req.query.id, user = req.user;
    (new navUserDAO()).getAddress(user._id)
    .then(function(n_User){
        user.address = n_User[0].address;
        user.city = n_User[0].city;
        user.state = n_User[0].state;
        return (new navToysDAO()).getToyDetailById(id)
    })
    .then(function(toyDetail){
        //console.log(toyDetail, id);
        if(toyDetail.length == 0)
        {
            return Q.reject();
        }
        res.render('order', {
            user : user,
            layout : 'nav_bar_layout',
            isLoggedIn : req.user ? true : false,
            toyDetail : toyDetail[0],
        });
    })
    .catch(function(err){
    
    })

});

router.post('/placeOrder',function(req, res){
    var id = req.query.id, dbClient; 
    console.log(req.user);
    (new navRentalsDAO()).getClient()
        .then(function(client){
            dbClient = client;
            return (new navRentalsDAO(dbClient)).startTx();
        })
        .then(function(){
            return (new navRentalsDAO(dbClient)).saveAnOrder(req.user._id, id, req.body.shippingAddress, new Date().getTime(), moment().add(15,'days').unix());
        })
        .then(function(){
            return (new navRentalsDAO(dbClient)).commitTx();
        })
        .then(function(){
            console.log("save");
            res.render('orderPlaced',{
                user : req.user,
                isLoggedIn : req.user ? true : false,
                layout : 'nav_bar_layout'
            });
        })
        .catch(function(err){
            console.log(err);
            if(dbClient){
                (new navRentalsDAO(dbClient)).rollbackTx()
                .finally(function(){
                    dbClient.release();
                })
            }
        })
        .finally(function(){
            if(dbClient)
                dbClient.release();
        })

});

module.exports = router;
