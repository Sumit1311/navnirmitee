var navBaseRouter = require(process.cwd() + "/lib/navBaseRouter.js"),
    querystring = require("querystring"),
    repeatHelper = require('handlebars-helper-repeat'),
    navResponseUtil = require(process.cwd() + "/lib/navResponseUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navOrders = require(process.cwd() + "/lib/navOrders.js"),
    navPayments = require(process.cwd() + "/lib/navPayments.js"),
    Q = require('q');

module.exports = class navAdminRouter extends navBaseRouter {
    constructor(){
       super();
    }


    setup(){
        this.router.use(this.ensureAuthenticated.bind(this), this.ensureSuperAdmin.bind(this))
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

        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                delete req.query.offset;
                res.render('navAdmin/orders', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_admin_layout',
                    queryParameters : querystring.stringify(req.query),
                    context : {
                        orderList : result.orderList,
                        statusList : result.statusList,
                        dateFormat : "YYYY-MM-DDTHH:mm:ssZ",
                        noOfPages : result.noOfPages,
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
        new navOrders().getOrdersList(offset, limit, [{ 
            column : columnOrdering[sortBy], 
            type : sortOrdering[sortType]
        }])
            .done((result) =>{
                deferred.resolve(result);
            }, (error) => {
                navLogUtil.instance().log.call(self, self.getOrders.name, "Error occured "+error, "error")
                deferred.reject(error);
            } )

    }

    saveOrders(req, res) {
        var body = req.body;
        var updateFields = [];
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
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
        for(var i = 0; i< body.length; i++) {
            var tmp = {};
            for(var j = 0; j < body[i].length; j++){
                tmp[body[i][j].name] = body[i][j].value;
            }
            updateFields.push(tmp);
        }

        var promises = [];
        for(i = 0;i < updateFields.length; i++) {
                //console.log(updateFields[i]);
                navLogUtil.instance().log.call(self, self.saveOrders.name, "Updating orders " + updateFields[i].orderId , "info");
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
                navLogUtil.instance().log.call(self, self.saveOrders.name, "Error occured "+error.stack, "error")
                deferred.reject(error);
            })
    }

    getPayments(req, res) {
        var offset = parseInt(req.query.offset) || 0, limit = 50, sortBy = req.query.sortBy ? req.query.sortBy : 0, sortType = req.query.sortType || 0;
        var columnOrdering = ["email_address", "amount_payable", "reason", "credit_date", "paid_date", "status", "transaction_summary", "next_retry_date", "expiration_date", "transaction_type"];
        var columnLabel = ["Customer Email", "Amount", "Payment Reason", "Initiate Date", "Success Date", "Status", "Summary", "Next Attempt", "Expiration Date", "Trasaction Type"];
        var sortOrdering = ["ASC", "DESC"];

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
                        paymentList : result.paymentList,
                        statusList : result.statusList,
                        dateFormat : "YYYY-MM-DDTHH:mm:ssZ",
                        noOfPages : result.noOfPages,
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

        new navPayments().getPaymentsList(offset, limit, [{
            column : columnOrdering[sortBy],
            type: sortOrdering[sortType]
        }])
            .done((result) =>{
                deferred.resolve(result);
            }, (error) => {
                navLogUtil.instance().log.call(self, self.getPayments.name, "Error occured" + error , "error");
                deferred.reject(error);
            })
    
    }
    savePayments(req, res) {
        var body = req.body;
        var updateFields = [];
        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(){
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
        for(var i = 0; i < body.length; i++) {
            var tmp = {};
            for(var j = 0; j < body[i].length; j++){
                tmp[body[i][j].name] = body[i][j].value;
            }
            updateFields.push(tmp);
        }

        var promises = [];
       for(i = 0; i < updateFields.length ; i++) {
           navLogUtil.instance().log.call(self, self.savePayments.name,"Updating payments with id : " + updateFields[i].paymentId , "info");
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
                navLogUtil.instance().log.call(self, self.savePayments.name, "Error occured" + error , "error");
                deferred.reject(error);
            })
    }
}
