"use strict";
var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navCommonUtils = require(process.cwd() + "/lib/navCommonUtil.js"),
    navDatabaseException = require(process.cwd() + "/lib/dao/exceptions/navDatabaseException.js"),
    BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    util = require("util");

function navRentalsDAO(client, persistence) {
    if (persistence) {
        BaseDAO.call(this, persistence);
    }
    this.providedClient = client ? client : undefined;
    return this;
}

util.inherits(navRentalsDAO, BaseDAO);

module.exports = navRentalsDAO;
//private variables
var tableName = "nav_rentals",
    rootUserId = "45058a54-b3e2-4a3b-96ab-c13dcf3023e3",
    fileName = 'toys/navRentalsDAO';

navRentalsDAO.prototype.saveAnOrder=function(userId, toyId, shippingAddress, startDate, endDate) {
    var self = this;
   return this.dbQuery("INSERT INTO "+tableName+" (_id, user_id,toys_id,shipping_address,lease_start_date, lease_end_date) VALUES($1,$2,$3,$4,$5,$6)",
           [new navCommonUtils().generateUuid(), userId, toyId, shippingAddress, startDate, endDate])
      .then(function(result){
         return result.rowCount;
      })
      .catch(function(error){
            navLogUtil.instance().log.call(self, "saveAnOrder",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBSETUP", navDatabaseException));
      });
}
