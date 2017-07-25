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
        var queryString1 = "INSERT INTO "+ tableName + " (_id, user_id, age_group, hobbies, gender)"; 
        var query2 = " VALUES($1, $2, $3, $4)";
        var params = [new navCommonUtil().generateUuid(), userId, ageGroup, hobbies, gender];
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
