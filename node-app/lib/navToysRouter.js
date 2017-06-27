var navBaseRouter = require(process.cwd() + '/lib/navBaseRouter.js')
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navSystemUtil = require(process.cwd() + "/lib/navSystemUtil.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    navLogicalException = require("node-exceptions").LogicalException;
    repeatHelper = require('handlebars-helper-repeat'),
    helpers = require('handlebars-helpers')(),
    passport = require('passport'),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

module.exports = class navToysRouter extends navBaseRouter {
    constructor() {
        super();
    }

    setup() {
        this.router.use(this.ensureAuthenticated, this.ensureVerified, this.isSessionAvailable);
        this.router.get('/detail', this.getToysDetails);
        this.router.get('/order', this.getOrder);
        this.router.post('/placeOrder',this.placeOrder);
        return this;
    }
    getToysDetails(req, res) {
        var id = req.query.id, toy;
        var deferred = Q.defer();
        deferred.promise
            .done((result) => {
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
            },(error) => {
                response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });

            })
        req.assert("id"," Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationError(validationErrors));
        }
        var navTDAO = new navToysDAO();
        navTDAO.getToyDetailById(id)
        .then(function(toyDetail){
            if(toyDetail.length == 0) {
                return Q.reject(new navLogicalException());
            }
            toy = toyDetail;
            return new navSystemUtil().getNoOfFilesMatchPat(toyDetail[0]._id+'_*',process.cwd() + '/../public/img/toys/');
        })
        .done(function(result){
            return deferred.resolve(result);
        },function(error){
            return deferred.reject(error);
        });
    } 
    getOrder(req, res) {
        var id = req.query.id, user = req.user;
        var deferred = Q.defer();
        deferred.promise
            .done((result) => {
                res.render('order', {
                    user : user,
                    layout : 'nav_bar_layout',
                    isLoggedIn : req.user ? true : false,
                    toyDetail : result[0]
                });
            },(error) => {
                response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });

            })
        req.assert("id"," Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationError(validationErrors));
        }
        var userDAO = new navUserDAO();
        userDAO.getAddress(user._id)
            .then(function(n_User){
                user.address = n_User[0].address;
                user.city = n_User[0].city;
                user.state = n_User[0].state;
                return (new navToysDAO()).getToyDetailById(id)
            })
        .then(function(toyDetail){
            //console.log(toyDetail, id);
            if(toyDetail.length == 0) {
                return Q.reject(new navLogicalException());
            }
            return toyDetail;
        })
        .done((toyDetail) => {
            deferred.resolve(toyDetail);
        },(err) => {
            deferred.reject(err);
        });
    }
    placeOrder(req, res){
        var id = req.query.id, dbClient; 
        var deferred = Q.defer();
        deferred.promise
            .done((result) => {
                res.render('orderPlaced',{
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout'
                });
            },(error) => {
                response = new navResponseUtil().generateErrorResponse(error);
                res.status(response.status).render("errorDocument",{
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    layout : 'nav_bar_layout',
                });

            })
        req.assert("id"," Bad Request").notEmpty();
        req.assert("shippingAddress","Bad Request").notEmpty();


        var validationErrors = req.validationErrors();
        //console.log(validationErrors);
        var response;
        if(validationErrors)
        {
            return deferred.reject(new navValidationError(validationErrors));
        }
        var rDAO = new navRentalsDAO();
        rDAO.getClient()
            .then(function(client){
                rDAO.providedClient = client;
                return rDAO.startTx();
            })
        .then(function(){
            return rDAO.saveAnOrder(req.user._id, id, req.body.shippingAddress, new Date().getTime(), moment().add(15,'days').unix());
        })
        .then(function(){
            return rDAO.commitTx();
        })
        .catch(function(err){
            return rDAO.rollbackTx()
            .done(() => {
                return Q.reject(err);
            }, (error) => {
                return Q.reject(error);
            })
        })
        .finally(function () {
            if (rDAO.providedClient) {
                rDAO.providedClient.release();
                rDAO.providedClient = undefined;
            }
        })
        .done(() => {
            deferred.resolve();
        },(error) => {
            deferred.reject(error);
        });
    }        
}
