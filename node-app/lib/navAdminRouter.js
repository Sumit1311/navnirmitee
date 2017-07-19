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
        var columnOrdering = ["email_address", "name", "lease_start_date", "delivery_date", "return_date", "lease_end_date", "address", "status"];
        var sortOrdering = ["ASC", "DESC"];
        var toysList, customerList, orderList, statusList, noOfOrders = 0, noOfPages;

        var deferred = Q.defer(), self = this;
        var respUtil =  new navResponseUtil();
        deferred.promise
            .done(function(result){
                debugger;
                delete req.query.offset;
                res.render('navAdmin/orders', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_admin_layout',
                    queryParameters : querystring.stringify(req.query),
                    context : {
                        toysList : toysList,
                        customerList : customerList,
                        orderList : orderList,
                        statusList : statusList,
                        dateFormat : navCommonUtil.getDateFormat(),
                        noOfPages : noOfPages,
                        perPageLimit : limit,
                        currentPage : offset ? (Math.floor(offset/limit) + 1) : 1,
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

        new navToysDAO().getToysFullList()
            .then((_toys) => {
                toysList = _toys;
                return new navUserDAO().getAllUsers();
            })
            .then((_users) => {
                customerList = _users;
                return new navRentalsDAO().getOrdersCount();
            })
            .then((_orderCount) => {
                noOfOrders = parseInt(_orderCount[0].count);

                if(noOfOrders % limit != 0 ) {
                    noOfPages = Math.floor(noOfOrders / limit) + 1;
                } else {
                    noOfPages = Math.floor(noOfOrders / limit) ;
                }
                debugger;
                return new navRentalsDAO().getOrdersFullList(offset, limit, columnOrdering[sortBy], sortOrdering[sortType]);
            } )
            .then((_rentals) => {
                orderList = _rentals;
                for(var i in orderList) {
                   orderList[i].delivery_date = orderList[i].delivery_date == null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].delivery_date));
                   orderList[i].return_date = orderList[i].return_date == null ? "" :new navCommonUtil().getDateString(parseInt(orderList[i].return_date));
                   orderList[i].lease_start_date =orderList[i].lease_start_date == null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_start_date));
                   orderList[i].lease_end_date =orderList[i].lease_end_date == null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_end_date));
                }
                var orderStatus = navRentalsDAO.getStatus();
                statusList = [];
                for(var i in orderStatus) {
                    if(orderStatus.hasOwnProperty(i))
                        statusList.push(orderStatus[i]);
                }
                return Q.resolve();
            })
            .done(() =>{
                deferred.resolve();
            }, (error) => {
                deferred.reject(error);
            } )

    }
}
