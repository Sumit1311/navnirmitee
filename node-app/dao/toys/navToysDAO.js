"use strict";

var BaseDAO = require(process.cwd() + "/dao/base/baseDAO.js"),
    Q = require("q"),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
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
            navnirmiteeApi.util.log.call(self, "getAllToys",  error.message, "error" );
            return Q.reject(navnirmiteeApi.util.getErrorObject(error,500,"DBTOYS", navDatabaseException));
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
            navnirmiteeApi.util.log.call(self, "getToyDetailsById",  error.message, "error" );
            return Q.reject(navnirmiteeApi.util.getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
};

