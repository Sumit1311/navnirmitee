
var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js");

var tableName = "nav_enquiry";

module.exports = class navEnquiryDAO extends BaseDAO{
    constructor(client, persistence) {
        super(persistence);
        this.providedClient = client;
    }

    saveEnquiry(name, email, contactNo, message){
        var self = this;
        return this.dbQuery("INSERT INTO "+ tableName+" (_id, name, email, contact_no, message, submission_date) VALUES($1,$2,$3,$4,$5,$6)",[navCommonUtil.generateUuid_S(), name, email, contactNo, message, navCommonUtil.getCurrentTime_S()])
            .then(function (result) {
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, self.saveEnquiry,  "Error occured : " + error.message, "error" );
            return Q.reject(new navCommonUtil().getErrorObject(error,500,"DBENQUIRY", navDatabaseException));
        });
    
    }


}
