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

        return this.dbQuery(queryString1+query2, params)
            .then(function (result) {
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "insertPaymentDetails", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }
}
