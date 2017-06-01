/**
 * This file will be used for Setting up and initializing db related stuff.
 * Like creating database tables, indices, any required views etc..
 *  Inherits the BaseDAO and uses it's API to query database.
 */
"use strict";

var BaseDAO = require(process.cwd() + "/dao/base/baseDAO.js"),
    UserDAO = require("./user/masterDAO"),
    Q = require("q"),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    util = require("util");

function SetupDB(persistence) {
    BaseDAO.call(this, persistence);
    return this;
}

util.inherits(SetupDB, BaseDAO);

module.exports = SetupDB;


/**
 * Sets up the schema for the app.
 *
 * @returns Q.Promise
 */
SetupDB.prototype.setupSchema = function () {
    var self = this;
    return this.dbQuery('CREATE TABLE IF NOT EXISTS "user_master" (' +
        ' "_id" VARCHAR(36) NOT NULL ,' +
        ' "first_name" VARCHAR(45) NULL DEFAULT NULL ,' +
        ' "last_name" VARCHAR(45) NULL DEFAULT NULL ,' +
        ' "login_email_id" VARCHAR(30) NULL DEFAULT NULL ,' +
        ' "mobile_no" VARCHAR(15) NULL DEFAULT NULL ,' +
        ' "residence_no" VARCHAR(20) NULL DEFAULT NULL ,' +
        ' "alternate_mobile_no" VARCHAR(15) NULL DEFAULT NULL ,' +
        ' "login_password" TEXT NULL ,' +
        ' "user_type" SMALLINT NULL ,' +
        ' "email_verification" TEXT NULL,' +
        ' PRIMARY KEY ("_id") );')
        .then(function () {
            //create the root user who is super admin and have all the accesses by default
            var userDAO = new UserDAO();
            return userDAO.createRootUser();
        }) 
        .catch(function (error) {
            if (error instanceof Error) {
                navnirmiteeApi.logger.fatal('[setupDB] [setupSchema] Error creating tables ', error.stack);
            } else {
                navnirmiteeApi.logger.fatal('[setupDB] [setupSchema] Error creating tables ', error);
            }
            return Q.reject(error);
        });
};


/**
 * This function creates Indexes by calling executeIndex function and on its success it calls recursively until
 * the indices to be created.
 * @param dbClient - use same dbClient
 * @param keys
 * @param values
 */
function indicesList(dbClient, keys, values) {
    /*var dbClient;*/
    var self = this;
    if (keys.length === 0 || values.length === 0) {
        return Q.resolve();
    } else {
        var key = keys.shift();
        var value = values.shift();
        /*return self.getClient()
         .then(function (_client) {
         dbClient = _client;*/
        return executeIndex(dbClient, key, value)/*;
         })*/.then(function () {
                return indicesList.call(self, dbClient, keys, values);
            });
    }
}

/**
 * This function creates Indexes in Database after checking its existence.
 * @param dbClient
 * @param indexName
 * @param createSql
 * @returns {*}
 */
function executeIndex(dbClient, indexName, createSql) {
    return dbClient.query(
        "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = $1 and n.nspname = 'public'", [indexName]
    ).then(function () {
            if (dbClient.results().rowCount > 0) {
                jive.logger.debug("[DBUtils]:[executeIndex] : Index - ", indexName, " - already Exist!");
                return Q.resolve();
            } else {
                jive.logger.debug("[DBUtils]:[executeIndex] : Index - ", indexName, " - Created Successfully");
                return dbClient.query(createSql);
            }
        });
}
