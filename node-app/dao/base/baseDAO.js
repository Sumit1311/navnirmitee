/**
 * This file provides the basic access to database. Persist the connection
 * with the help of jive-persistence-postgres module. All DAO classes
 * inherits this to query database. This acts as a interface to query database.
 *
 */

// will be used to save database persistence
var db;
var pgConnection = require("./pg-conn.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/dao/exceptions/navDatabaseException.js'),
    fileName = "baseDAO.js"
    navnirmiteeApi = require(process.cwd() + "/lib/api.js");

function BaseDAO(persistence) {
    //if some custom persistence provided use it other wise use the default postgres persistence
    db = persistence;
    if (!db) {
        db = pgConnection.persistence;
    }
}

module.exports = BaseDAO;

/**
 * Fetches a client from pool.
 *
 * @returns {Q.promise}
 */
BaseDAO.prototype.getClient = function () {
    var self = this;
    return db.getQueryClient()
        .catch(function(error){
            navnirmiteeApi.util.log.call(self,"getClient","Error occured connecting database : " + error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBCONN", navDatabaseException));
        })
};

/**
 * This method generates the execute method for transaction related queries.
 * @param query : querystring
 * @param param : query parameters
 * @returns {{setClient: Function, execute: Function}}
 */
BaseDAO.prototype.executeTransaction = function (query, param) {
    var client;
    var self = this;
    return {
        setClient: function (clientToUse) {
            client = clientToUse;
            return this;
        },
        //method to execute the required operation if client is already available uses that (without releasing)
        //other wise gets a client from pool and releases it after the operation
        execute: function () {
            var deferred = Q.defer();
            // if client is not provided; fetch one fresh from the pool
            // and release it when done
            self.providedClient = client;
            self.dbQuery(query, param)
                .then(function (results) {
                    deferred.resolve(results);
                }, function (err) {
                    deferred.reject();
                })
            .catch(function(error){
                
                navnirmiteeApi.util.log.call(self, "executeTransaction","Error : " + error.message, "error");
                return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBTRANSAC", navDatabaseException));
            })

            return deferred.promise;
        }
    }

};

/**
 * Queries the database using given sql statement
 * Executes the given query on database. and returns the promise for the result
 *
 * @param sql
 * @param params
 * @returns {*}
 */
BaseDAO.prototype.dbQuery = function (sql, params) {
    var client, promise, self = this;
    if (this.providedClient == undefined) {
        navnirmiteeApi.logger.debug("[baseDAO] [dbQuery] No client provided getting new one");
        promise = this.getClient();
    } else {
        navnirmiteeApi.logger.debug("[baseDAO] [dbQuery] Using provided client");
        promise = Q.resolve(this.providedClient)
    }
    return promise
        .then(function (_client) {
            client = _client;
            return query(client, sql, params);
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "dbQuery","Error executing query "+ sql +" params : "+ params +" : " + error.message, "debug" );
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBQUERY", navDatabaseException));
        })
        .finally(function () {
            if (self.providedClient == undefined && client) {
                client.release();
            }
        })
    
}

function query(dbClient, sql, params) {
        return dbClient.query(sql, params)
            .then(function () {
                var results = dbClient.results();
                /*
                 results is of form : {
                 rows:[],
                 rowCount:<<number>>
                 }
                 */
                navnirmiteeApi.logger.debug("Successfully Executed query ", sql, "with params ", params);
                return Q.resolve(results);
            })
            .catch(function (error) {
                return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBQUERY", navDatabaseException));
            })
};

BaseDAO.prototype.startTx = startTx;
BaseDAO.prototype.commitTx = commitTx;
BaseDAO.prototype.rollBackTx = rollbackTx;
//BaseDAO.prototype.savePointTx = savePointTx;

function startTx() {
    if (!this.providedClient) {
        navnirmiteeApi.util.log.call(this, "startTx", "Invalid Client", "error");
        return Q.reject(navnirmiteeApi.util.getErrorObject({message : "Invalid Client"}, 500, "DBTRANSAC", navDatabaseException));
    }
    return this.dbQuery("BEGIN");
}

function commitTx() {
    if (!this.providedClient) {
        navnirmiteeApi.util.log.call(this, "commitTx", "Invalid Client", "error");
        return Q.reject(navnirmiteeApi.util.getErrorObject({message : "Invalid Client"}, 500, "DBTRANSAC", navDatabaseException));
    }
    return this.dbQuery("COMMIT");
}

function rollbackTx(clientFromPool, savePointName) {
    if (!this.providedClient) {
        navnirmiteeApi.util.log.call(this, "rollBackTx", "Invalid Client", "error");
        return Q.reject(navnirmiteeApi.util.getErrorObject({message : "Invalid Client"}, 500, "DBTRANSAC", navDatabaseException));

    }
    if (savePointName) {
        return this.dbQuery("ROLLBACK TO SAVEPOINT " + savePointName + ";");
    } else {
        return this.dbQuery("ROLLBACK;");
    }

}

/*function savePointTx(clientFromPool, savePointName) {
 if (!clientFromPool) {
 throwError("Can't start tx, invalid client");
 }
 if (!savePointName) {
 throwError("Need save point name");
 }
 return clientFromPool.query("SAVEPOINT " + savePointName + ";");
 }*/

