/**
 * This file will be used for Setting up and initializing db related stuff.
 * Like creating database tables, indices, any required views etc..
 *  Inherits the BaseDAO and uses it's API to query database.
 */
"use strict";

var BaseDAO = require(process.cwd() + "/dao/base/baseDAO.js"),
    UserDAO = require("./user/userDAO"),
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
    return this.dbQuery('CREATE TABLE IF NOT EXISTS nav_user( _id varchar(36) NOT NULL, first_name text, last_name text, email_address varchar(30), mobile_no varchar(15), password text, emai_verification smallint, address text, city varchar(50), state varchar(30), is_active smallint, user_type smallint, CONSTRAINT nav_user_id_pk PRIMARY KEY (_id));')
        .then(function () {
            //create the root user who is super admin and have all the accesses by default
            var userDAO = new UserDAO();
            return userDAO.createRootUser();
        })
        .then(() => {
            return self.dbQuery('CREATE TABLE IF NOT EXISTS nav_toys (_id varchar(36), name varchar(50), stock integer, price varchar(20), points integer, age_group smallint, category smallint, parent_toys_id varchar(36), CONSTRAINT _id PRIMARY KEY (_id), CONSTRAINT nav_toys_parent_toys_id_fk FOREIGN KEY (parent_toys_id) REFERENCES  nav_toys (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE)');
        })
        .then(() => {
            return self.dbQuery('CREATE TABLE IF NOT EXISTS nav_rentals( user_id varchar(36), toys_id varchar(36), lease_start_date bigint, lease_end_date bigint, CONSTRAINT nav_rental_id_pk PRIMARY KEY (user_id,toys_id),CONSTRAINT nav_rentals_toys_id_fk FOREIGN KEY (toys_id) REFERENCES  nav_toys (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE,CONSTRAINT nav_rentals_user_id_fk FOREIGN KEY (user_id) REFERENCES  nav_user (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE); ');
        })
        .then(() => {
            return self.dbQuery('CREATE TABLE IF NOT EXISTS nav_payments( _id varchar(36), last_payment_date bigint, user_id varchar(36), balance_points integer, balance_amount integer, CONSTRAINT nav_payments_id PRIMARY KEY (_id), CONSTRAINT nav_payments_user_id FOREIGN KEY (user_id) REFERENCES  nav_user (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE) ');
        })
        .then(() => {
            return self.dbQuery('CREATE TABLE IF NOT EXISTS nav_payments( _id varchar(36), last_payment_date bigint, user_id varchar(36), balance_points integer, balance_amount integer, CONSTRAINT nav_payments_id PRIMARY KEY (_id), CONSTRAINT nav_payments_user_id FOREIGN KEY (user_id) REFERENCES  nav_user (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE) ');
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
