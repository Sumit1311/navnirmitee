"use strict";

var BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtils = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
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


navToysDAO.prototype.getAllToys = function (offset, limit, ageGroups, categories, query, sortBy, sortType) {
    var self = this;
    var queryString = "SELECT _id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description" +
    " FROM " + tableName + " ";//" LIMIT $1 OFFSET $2";
    var params = [];
    var count = 0;
    sortBy = sortBy ? sortBy : "name";
    sortType = sortType ? sortType : "ASC";
    if((ageGroups && ageGroups.length !== 0) || (categories && categories.length !== 0) || query)
    {
        queryString += " WHERE ";
    }
    if(ageGroups && ageGroups.length !== 0) {
        queryString += "age_group IN ("        
        for(var i = 0; i < ageGroups.length; i++)
        {
            count++;
            queryString += "$" + (count);
            if(i == ageGroups.length - 1) {
                queryString += ") ";
            } else {
                queryString += ",";
            }
            params.push(ageGroups[i]);
        }    
    }

    console.log(categories);
    if(categories && categories.length !== 0) {
        if(count !== 0) {
            queryString += " AND "
        }
        queryString += " category IN ("        
        for(var i = 0; i < categories.length; i++)
        {
            count++;
            queryString += "$" + (count);
            if(i == categories.length - 1) {
                queryString += ") ";
            } else {
                queryString += ",";
            }
            params.push(categories[i]);
        }    
            
    }


    if(query) {
        if(count !== 0) {
            queryString += " AND "
        }
        if(query.length > 0) {
            queryString += " ( "
        }
        for(var w in query) {
            queryString += " ( name ~ $"+ (++count) + " ";
            queryString += " OR long_description ~ $"+count + " ";
            queryString += " OR short_description ~ $" + count + ") ";
            params.push(query[w]); 
            if(w != query.length - 1) {
                queryString += " OR ";
            }
        }
        if(query.length > 0) {
            queryString += " ) "
        }
    }

    if(sortBy) {
        queryString += " ORDER BY "+sortBy;
    }
    if(sortType) {
        queryString += " " + sortType;
    }

    if(limit)
    {
        queryString += " LIMIT $" + (++count);
        params.push(limit);
    }

    if(offset)
    {
        queryString += " OFFSET $"+(++count);
        params.push(offset);
    }

    console.log(queryString);
    return this.dbQuery(queryString, params)
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
    return this.dbQuery("SELECT _id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description, rent_duration" +
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

navToysDAO.prototype.getToysFullList = function() {
    var self = this;
    return this.dbQuery("SELECT name, _id FROM nav_toys")
        .then(function (result) {
            return result.rows;
        })
    .catch(function (error) {
            navLogUtil.instance().log.call(self, "getToysFullList",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
    
}

navToysDAO.prototype.updateToyStock = function(toyId, stock, increment) {
    var self = this;
    return this.dbQuery("UPDATE "+tableName + " SET stock " +  "= stock "+ (increment ? "+" : "-")+"$1 WHERE _id=$2", [stock, toyId])
        .then(function (result) {
            return result.rows;
        })
    .catch(function (error) {
            navLogUtil.instance().log.call(self, "updateToyStock",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
}
