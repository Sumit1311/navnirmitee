"use strict";

var BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtils = require(process.cwd() + "/lib/navCommonUtil.js"),
    util = require("util");

function navToysDAO(client, persistence) {
    if (persistence) {
        BaseDAO.call(this, persistence);
    }
    this.providedClient = client ? client : undefined;
    return this;
}

util.inherits(navToysDAO, BaseDAO);

module.exports = navToysDAO;
//private variables
var tableName = "nav_toys",
    rootUserId = "45058a54-b3e2-4a3b-96ab-c13dcf3023e3",
    fileName = 'toys/navToysDAO';


navToysDAO.prototype.getAllToys = function (offset, limit) {
    var self = this;
    return this.dbQuery("SELECT _id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description" +
    " FROM " + tableName + " LIMIT $1 OFFSET $2",[limit, offset])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllToys",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
        });

};

navToysDAO.prototype.getToyDetailById = function (toyId) {
    var self = this;
    return this.dbQuery("SELECT _id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description" +
            " FROM " + tableName + " WHERE _id = $1",[toyId])
        .then(function (result) {
            return result.rows;
        })
    .catch(function (error) {
            navLogUtil.instance().log.call(self, "getToyDetailsById",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
};

navToysDAO.prototype.getAllRentalTransactions = function(userId) {
    var self = this;
    return this.dbQuery("SELECT t.name, t.price, r.transaction_date, r.status FROM nav_toys t INNER JOIN nav_rentals r ON (t._id = r.toys_id) WHERE r.user_id = $1",[userId])
        .then(function (result) {
            return result.rows;
        })
    .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllRentalTransactions",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
}
