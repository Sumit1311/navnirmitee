var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    navPGRouter = require(process.cwd() + "/lib/navPGRouter.js"),
    querystring = require("querystring"),
    repeatHelper = require('handlebars-helper-repeat'),
    navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navOrders = require(process.cwd() + "/lib/navOrders.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    helpers = require('handlebars-helpers')(),
    moment =require('moment'),
    Q = require('q');

module.exports = class navAdminRouter extends navBaseRouter {
    constructor(){
       super();
    }


    setup(){
        this.router.use(this.ensureAuthenticated, this.ensureSuperAdmin)
        this.router.get('/', this.getAdminHome.bind(this)); 
        this.router.get('/orders', this.getOrders.bind(this)); 
        this.router.get('/payments', this.getPayments.bind(this)); 
        this.router.post('/orders/save', this.saveOrders.bind(this)); 
        this.router.post('/payments/save', this.savePayments.bind(this)); 
        //this.router.get('/', this.ensureVerified, this.getHome);
        return this;
    }
    getAdminHome(req, res) {
        res.render('navAdmin/dashboard', {
            user : req.user,
            isLoggedIn : req.user ? true : false,
            layout : 'nav_admin_layout'
        });
    }
    getOrders(req, res) {
        var offset = parseInt(req.query.offset) || 0, limit = 50, sortBy = req.query.sortBy ? req.query.sortBy : 0, sortType = req.query.sortType || 0;
        var columnOrdering = ["email_address", "name", "lease_start_date", "delivery_date", "returned_date", "lease_end_date", "shipping_address", "status"];
        var columnLabel = ["Customer Label", "Toys Name", "Order Placement Date", "Delivery Date", "Returned Date", "Lease Expiry", "Shipping Address", "Order Status"]
        var sortOrdering = ["ASC", "DESC"];
        var toysList, customerList, orderList, statusList, noOfOrders = 0, noOfPages;

        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                delete req.query.offset;
                debugger;
                res.render('navAdmin/orders', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_admin_layout',
                    queryParameters : querystring.stringify(req.query),
                    context : {
                        orderList : orderList,
                        statusList : statusList,
                        dateFormat : "YYYY-MM-DDTHH:mm:ssZ",
                        noOfPages : noOfPages,
                        perPageLimit : limit,
                        currentPage : offset ? (Math.floor(offset/limit) + 1) : 1,
                        sortType : sortType == 1 ? 0 : 1,
                        sortBy : sortBy,
                        columnLabel : columnLabel
                    },
                        helpers : {
                            repeat : repeatHelper
                        }
                })
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    isAdmin : true,
                    layout : 'nav_admin_layout',

                });
            });

        return new navRentalsDAO().getOrdersCount()
            .then((_orderCount) => {
                noOfOrders = parseInt(_orderCount[0].count);

                if(noOfOrders % limit !== 0 ) {
                    noOfPages = Math.floor(noOfOrders / limit) + 1;
                } else {
                    noOfPages = Math.floor(noOfOrders / limit) ;
                }
                return new navRentalsDAO().getOrdersFullList(offset, limit, columnOrdering[sortBy], sortOrdering[sortType]);
            } )
            .then((_rentals) => {
                orderList = _rentals;
                for(var i in orderList) {
                   orderList[i].delivery_date = orderList[i].delivery_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].delivery_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].returned_date = orderList[i].returned_date === null ? "" :new navCommonUtil().getDateString(parseInt(orderList[i].returned_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].lease_start_date =orderList[i].lease_start_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_start_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].lease_end_date =orderList[i].lease_end_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_end_date), "YYYY-MM-DDTHH:mm:ssZ");
                }
                var orderStatus = navRentalsDAO.getStatus();
                statusList = [];
                for(var i in orderStatus) {
                    if(orderStatus.hasOwnProperty(i)) {
                        statusList.push(orderStatus[i]);
                    }
                }
                return Q.resolve();
            })
            .done(() =>{
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            } )

    }

    saveOrders(req, res) {
        var body = req.body;
        var updateFields = [];
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil(), cancelledOrders = [];
        deferred.promise
            .done(function(result){
                respUtil.redirect(req, res, "/admin/orders");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    isAdmin : true,
                    layout : 'nav_admin_layout',

                });
            });
        for(var i in body) {
            var tmp = {};
            for(var j in body[i]){
                tmp[body[i][j].name] = body[i][j].value;
            }
            updateFields.push(tmp);
        }

        var promises = [];
        for(var i in updateFields) {
                console.log(updateFields[i]);
                promises.push(new navOrders().updateOrder(updateFields[i].orderId,updateFields[i].toyId, updateFields[i].userId, updateFields[i])); 
        }
        Q.allSettled(promises)
            .then((result)=>{
                for(var i in result) {
                    if(result[i].state == 'rejected') {
                        return Q.reject(result[i].reason)
                    }
                }
                return Q.resolve();
            })
            .done(() => {
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            })
    }

    getPayments(req, res) {
        var offset = parseInt(req.query.offset) || 0, limit = 50, sortBy = req.query.sortBy ? req.query.sortBy : 0, sortType = req.query.sortType || 0;
        var columnOrdering = ["email_address", "amount_payable", "reason", "credit_date", "paid_date", "status", "transaction_summary", "next_retry_date", "expiration_date", "transaction_type"];
        var columnLabel = ["Customer Email", "Amount", "Payment Reason", "Initiate Date", "Success Date", "Status", "Summary", "Next Attempt", "Expiration Date", "Trasaction Type"];
        var sortOrdering = ["ASC", "DESC"];
        var toysList, customerList, paymentList, statusList, noOfOrders = 0, noOfPages;

        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                delete req.query.offset;
                res.render('navAdmin/payments', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_admin_layout',
                    queryParameters : querystring.stringify(req.query),
                    context : {
                        paymentList : paymentList,
                        statusList : statusList,
                        dateFormat : "YYYY-MM-DDTHH:mm:ssZ",
                        noOfPages : noOfPages,
                        perPageLimit : limit,
                        currentPage : offset ? (Math.floor(offset/limit) + 1) : 1,
                        sortType : sortType == 1 ? 0 : 1,
                        sortBy : sortBy,
                        columnLabel : columnLabel
                    },
                        helpers : {
                            repeat : repeatHelper
                        }
                })
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    isAdmin : true,
                    layout : 'nav_admin_layout',

                });
            });

        return new navPaymentsDAO().getPaymentsCount()
            .then((_paymentCount) => {
                noOfOrders = parseInt(_paymentCount[0].count);

                if(noOfOrders % limit !== 0 ) {
                    noOfPages = Math.floor(noOfOrders / limit) + 1;
                } else {
                    noOfPages = Math.floor(noOfOrders / limit) ;
                }
                return new navPaymentsDAO().getPaymentsFullList(offset, limit, columnOrdering[sortBy], sortOrdering[sortType]);
            } )
            .then((_rentals) => {
                paymentList = _rentals;
                for(var i in paymentList) {
                    if(paymentList.hasOwnProperty(i)) {
                        paymentList[i].credit_date = paymentList[i].delivery_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].credit_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].paid_date = paymentList[i].paid_date === null ? "" :new navCommonUtil().getDateString(parseInt(paymentList[i].paid_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].next_retry_date =paymentList[i].next_retry_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].next_retry_date), "YYYY-MM-DDTHH:mm:ssZ");
                        paymentList[i].expiration_date =paymentList[i].expiration_date === null ? "" : new navCommonUtil().getDateString(parseInt(paymentList[i].expiration_date), "YYYY-MM-DDTHH:mm:ssZ");
                    }
                }
                var paymentStatus = navPaymentsDAO.getStatus();
                statusList = [];
                for(var i in paymentStatus) {
                    if(paymentStatus.hasOwnProperty(i)) {
                        statusList.push(paymentStatus[i]);
                    }
                }
                return Q.resolve();
            })
            .done(() =>{
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            } )
    
    }
    savePayments(req, res) {
        var body = req.body;
        var updateFields = [];
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                respUtil.redirect(req, res, "/admin/payments");
            },function(error){
                var response = respUtil.generateErrorResponse(error);
                respUtil.renderErrorPage(req, res, {
                    errorResponse : response,
                    user : req.user,
                    isLoggedIn : false,
                    isAdmin : true,
                    layout : 'nav_admin_layout',

                });
            });
        for(var i in body) {
            var tmp = {};
            for(var j in body[i]){
                tmp[body[i][j].name] = body[i][j].value;
            }
            updateFields.push(tmp);
        }

        var promises = [];
        for(i = 0; i < updateFields.length ; i++) {
            promises.push(new navPayments().updatePayment(updateFields[i].paymentId,updateFields[i])); 
        }
        Q.allSettled(promises)
            .then((result)=>{
                for(var i in result) {
                    if(result[i].state == 'rejected') {
                        return Q.reject(result[i].reason)
                    }
                }
                return Q.resolve();
            })
            .done(() => {
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            })
    }
}
