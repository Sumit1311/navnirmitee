var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js");

var tableName = "nav_toys_skills";

module.exports = class navToysSkillsDAO extends BaseDAO{
    constructor(client, persistence) {
        super(persistence);
        this.providedClient = client;
    }

    getSkillsForToy(toyId){
        var self = this;
        return this.dbQuery("SELECT skill" +
                " FROM " + tableName + " WHERE toys_id = $1",[toyId])
            .then(function (result) {
                for(var i =0 ;i < result.rows.length; i++) {
                    result.rows[i].skill = navCommonUtil.getSkills()[result.rows[i].skill].name;
                }
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getSkillsForToy",  error.message, "error" );
            return Q.reject(new navCommonUtil().getErrorObject(error,500,"DBTOYS", navDatabaseException));
        });
    
    }


}
