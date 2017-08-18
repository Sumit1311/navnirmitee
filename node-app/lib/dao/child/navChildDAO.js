var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js");

var tableName = "nav_child";

module.exports = class navChildDAO extends BaseDAO{
    constructor(client, persistence) {
        super(persistence);
        this.providedClient = client;
    }
    insertChildDetails(userId, ageGroup, hobbies, gender) {
        var self = this;
        if(!ageGroup && !hobbies && !gender) {
            return Q.resolve(0);
        }
        
        var queryString1 = "INSERT INTO "+ tableName + " (_id, user_id ";
        var query2 = " VALUES($1, $2 ";
        var params = [new navCommonUtil().generateUuid(), userId];

        var count = 2;
        if(ageGroup) {
            count++;
            queryString1 += " , age_group";
            query2 += ", $"+count +" ";
            params.push(ageGroup);
        }

        if(hobbies) {
            count++;
            queryString1 += " , hobbies";
            query2 += ", $"+count +" ";
            params.push(hobbies);
        
        }
        if(gender) {
            count++;
            queryString1 += " , gender";
            query2 += ", $"+count +" ";
            params.push(gender);
        }

        queryString1 += ") "
        query2 += ") "
        navLogUtil.instance().log.call(this, "insertChildDetails", "Insert for "+ userId + "" , "debug");
        return this.dbQuery(queryString1+query2, params)
            .then(function (result) {
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "insertChildDetails", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }

    getChildren(userId) {
        var self = this;
        
        var queryString = "SELECT _id, age_group, gender, hobbies FROM  "+ tableName + " WHERE user_id = $1 ";
        var params = [userId];
        
        return this.dbQuery(queryString, params)
            .then(function (result) {
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, self.getChildren.name, error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }

    updateChildDetail(childId, ageGroup, gender, hobbies) {
        var self = this;
        
        var queryString = "UPDATE "+ tableName + " SET age_group = $1, gender = $2, hobbies = $3 WHERE _id = $4";
        var params = [ageGroup, gender, hobbies,childId];
        
        return this.dbQuery(queryString, params)
            .then(function (result) {
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, self.getChildren.name, error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
        
    }
}
