"use strict";
var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navCommonUtils = require(process.cwd() + "/lib/navCommonUtil.js"),
    navDatabaseException = require(process.cwd() + "/lib/dao/exceptions/navDatabaseException.js"),
    BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    util = require("util");

var STATUS = {
        DELIVERED : "DELIVERED",
        RETURNED : "RETURNED",
        PLACED : "PLACED",
	CANCELLED : "CANCELLED"
    };


function navRentalsDAO(client, persistence) {
    if (persistence) {
        BaseDAO.call(this, persistence);
    }
    this.providedClient = client ? client : undefined;
    this.STATUS = STATUS;
    return this;
}

util.inherits(navRentalsDAO, BaseDAO);

module.exports = navRentalsDAO;
//private variables
var tableName = "nav_rentals",
    rootUserId = "45058a54-b3e2-4a3b-96ab-c13dcf3023e3",
    fileName = 'toys/navRentalsDAO';

navRentalsDAO.prototype.saveAnOrder=function(userId, toyId, shippingAddress, startDate, endDate, status) {
    var self = this;
   return this.dbQuery("INSERT INTO "+tableName+" (_id, user_id,toys_id,shipping_address,lease_start_date, lease_end_date, status, transaction_date) VALUES($1,$2,$3,$4,$5,$6, $7, $8)",
           [new navCommonUtils().generateUuid(), userId, toyId, shippingAddress, startDate, endDate, status, startDate])
      .then(function(result){
         return result.rowCount;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "saveAnOrder",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
      });
}

navRentalsDAO.prototype.getOrdersByUserId = function (userId) {
    var self = this;
    return this.dbQuery("SELECT _id FROM "+ tableName + " WHERE user_id = $1 AND status != $2",[userId, this.STATUS.RETURNED])
      .then(function(result){
         return result.rows;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "getOrdersByUserId",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
      });
}

navRentalsDAO.prototype.getAllOrders = function(userId) {
    var self = this;
    return this.dbQuery("SELECT lease_start_date, lease_end_date, status, delivery_date, returned_date, name, price FROM "+ tableName + " r INNER JOIN nav_toys t ON r.toys_id = t._id WHERE r.user_id = $1",[userId])
      .then(function(result){
         return result.rows;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "getAllOrders",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
      });

}

navRentalsDAO.prototype.getOrdersFullList = function(offset, limit, sortBy, sortType) {
    var self = this;
    var sort = sortType ? sortType : "ASC", sortCol = sortBy ? sortBy : "email_address", p_offset = offset ? offset : 0, p_limit = limit ? limit : 5;
    var params = [sortCol,  p_limit, p_offset];
   var queryString = "SELECT r._id, user_id, lease_start_date, lease_end_date, status, delivery_date, returned_date, name , toys_id, email_address, shipping_address FROM "+ tableName + " r INNER JOIN nav_toys t ON r.toys_id = t._id INNER JOIN nav_user u ON r.user_id = u._id ORDER BY $1 " + sort +" LIMIT $2 OFFSET $3" 
    return this.dbQuery(queryString , params)
      .then(function(result){
         return result.rows;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "getOrdersFullList",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
      });

}
navRentalsDAO.getStatus= function(){
	return STATUS;
}
navRentalsDAO.prototype.getOrdersCount = function() {
    var self = this;
    return this.dbQuery("select count(_id) AS count FROM "+tableName)
      .then(function(result){
         return result.rows;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "getOrdersFullList",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
      });

}
