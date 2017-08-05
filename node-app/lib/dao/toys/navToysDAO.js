
var BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtils = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    util = require("util");

function navToysDAO(client, persistence) {
    var self = this;
    if (persistence) {
        BaseDAO.call(self, persistence);
    }
    this.providedClient = client ? client : undefined;
    return this;
}

util.inherits(navToysDAO, BaseDAO);

module.exports = navToysDAO;
//private variables
var tableName = "nav_toys";


navToysDAO.prototype.getAllToys = function (offset, limit, ageGroups, categories, query, sortBy, sortType, skills, brands) {
    var self = this;
    var queryString = "SELECT t._id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description" +
    " FROM " + tableName + " t ";//" LIMIT $1 OFFSET $2";
    var params = [];
    var count = 0;
    sortBy = sortBy ? sortBy : "name";
    sortType = sortType ? sortType : "ASC";
    if(skills && skills.length !== 0){
        queryString += " INNER JOIN nav_toys_skills s ON t._id = s.toys_id "
    }
    if((ageGroups && ageGroups.length !== 0) || (categories && categories.length !== 0) || (skills && skills.length !== 0) || (brands && brands.length !== 0))
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

    //console.log(categories);
    if(categories && categories.length !== 0) {
        if(count !== 0) {
            queryString += " AND "
        }
        queryString += " category IN ("        
        for(var j = 0; j < categories.length; j++)
        {
            count++;
            queryString += "$" + (count);
            if(j == categories.length - 1) {
                queryString += ") ";
            } else {
                queryString += ",";
            }
            params.push(categories[j]);
        }    
            
    }
    
    if(skills && skills.length !== 0) {
        if(count !== 0) {
            queryString += " AND "
        }
        queryString += " s.skill IN ("        
        for(var k = 0; k < skills.length; k++)
        {
            count++;
            queryString += "$" + (count);
            if(k == skills.length - 1) {
                queryString += ") ";
            } else {
                queryString += ",";
            }
            params.push(skills[k]);
        }    
            
    }

    if(brands && brands.length !== 0) {
        if(count !== 0) {
            queryString += " AND "
        }
        queryString += " brand IN ("        
        for(var l = 0; l < brands.length; l++)
        {
            count++;
            queryString += "$" + (count);
            if(l == brands.length - 1) {
                queryString += ") ";
            } else {
                queryString += ",";
            }
            params.push(brands[l]);
        }    
            
    }
    //console.log(query);
    if(query && query.length !== 0) {
        var shouldAppend = true;
        for(var w =0; w < query.length; w++) {
            if(query[w] === "") {
                continue;
            }
            if(shouldAppend) {
                if(count !== 0) {
                    queryString += " AND "
                } else {
                    queryString += " WHERE "
                }
                if(query.length > 0) {
                    queryString += " ( "
                }
                shouldAppend = false;
            }
            queryString += " ( name ~ $"+ (++count) + " ";
            queryString += " OR long_description ~ $"+count + " ";
            queryString += " OR short_description ~ $" + count + ") ";
            params.push(query[w]); 
            if(w != query.length - 1) {
                queryString += " OR ";
             } else {
                queryString += " ) "
            }
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

    //console.log(queryString);
    navLogUtil.instance().log.call(self, self.getAllToys.name, "Get toys list with given filters", "debug");

    return this.dbQuery(queryString, params)
        .then(function (result) {
            navLogUtil.instance().log.call(self, self.getAllToys.name, "Got " + result.rowCount + " toys ", "debug");
                        return result.rows;
        })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllToys",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
        });

};

navToysDAO.prototype.getToyDetailById = function (toyId) {
    var self = this;
    navLogUtil.instance().log.call(self, self.getToyDetailById.name, "Fetch toys details by id " + toyId, "debug");

    return this.dbQuery("SELECT _id, name, stock , price, points , age_group , category , parent_toys_id, short_description, long_description, rent_duration, brand" +
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
    navLogUtil.instance().log.call(self, self.updateToyStock.name, "Update the toy "+ toyId+" stock with "+increment + stock, "debug");
    return this.dbQuery("UPDATE "+tableName + " SET stock " +  "= stock "+ (increment ? "+" : "-")+"$1 WHERE _id=$2", [stock, toyId])
        .then(function (result) {
            return result.rows;
        })
    .catch(function (error) {
            navLogUtil.instance().log.call(self, "updateToyStock",  error.message, "error" );
            return Q.reject(new navCommonUtils().getErrorObject(error,500,"DBTOYS", navDatabaseException));
    });
}
