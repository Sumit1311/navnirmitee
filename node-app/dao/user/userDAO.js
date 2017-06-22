/**
 * UserDAO --
 *  Used to interact with the table user_master. Has methods for CRUD operations on this table.
 *
 *  Note about user_type column :
 *      0 --- Super Admin
 *      1 --- Admin
 *      2 --- Normal User
 *      3 --- Moderator
 *      4 --- Guest
 *
 */

"use strict";

var BaseDAO = require(process.cwd() + "/dao/base/baseDAO.js"),
    Q = require("q"),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    navDatabaseException = require(process.cwd()+'/dao/exceptions/navDatabaseException.js'),
    util = require("util");

function UserDAO(client, persistence) {
    if (persistence) {
        BaseDAO.call(self, persistence);
    }
    this.providedClient = client ? client : undefined;
    return this;
}

util.inherits(UserDAO, BaseDAO);

module.exports = UserDAO;
//private variables
var tableName = "nav_user",
    rootUserId = "45058a54-b3e2-4a3b-96ab-c13dcf3023e3",
    fileName = 'user/masterDAO';

/**
 * Get login details for the user specified by loginName
 *
 * @returns {*}
 */
UserDAO.prototype.getLoginDetails = function (loginName) {
    var self = this;
    return this.dbQuery("SELECT _id,password,email_verification,email_address,mobile_no,first_name,last_name,user_type" +
    " FROM " + tableName + " WHERE email_address=$1", [loginName])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "getLoginDetails", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        });
};

/**
 * Get address for the user specified by id
 *
 * @returns {*}
 */
UserDAO.prototype.getAddress = function (userId) {
    var self = this;
    return this.dbQuery("SELECT address, city, state" +
    " FROM " + tableName + " WHERE _id=$1", [userId])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "getAddress", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        });
};
/**
 * Creates the super admin of the application.
 *
 * @returns {*}
 */
UserDAO.prototype.createRootUser = function (client) {
    var self = this;
    return self.dbQuery('select * from ' + tableName + ' where _id=$1', [rootUserId])
        .then(function (result) {
            if (result.rowCount == 0) {
                return self.dbQuery('INSERT INTO ' + tableName + '(_id,first_name,user_type,email_address,password) ' +
                'VALUES($1,$2,$3,$4,$5)', [rootUserId, "Admin", navnirmiteeApi.constants.userRoleMapping.SUPER_ADMIN, "_root_@localhost.com", navnirmiteeApi.util.encryptPassword("_toor_")]);
            } else {
                return Q.resolve();
            }
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "getAddress", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        });
};

/**
 * This method retireves email verification details for the given user
 *
 * @param email : user's email id
 * @returns {*}
 */
UserDAO.prototype.getEmailVerificationDetails = function (email) {
    var self = this;
    return this.dbQuery("select email_address,mobile_no,email_verification " +
    "from " + tableName + " where email_address = $1", [email])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "getAddress", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        })
};

/**
 * This method inserts basic registration data of a new user.
 *
 * @param email
 * @param phone
 * @param verificationCode
 * @returns {*}
 */
UserDAO.prototype.insertRegistrationData = function (email, phone, password, verificationCode) {
    var self = this;
    return this.dbQuery("INSERT INTO " + tableName +
    " (_id,email_address,mobile_no,email_verification, password)" +
    " VALUES($1,$2,$3,$4,$5)", [navnirmiteeApi.util.uuid(), email, phone, verificationCode, password])
        .then(function (result) {
            return result.rowCount;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "insertRegistrationData", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        });
};

/**
 * This method updates the user's basic profile details at time of email verification.
 *
 * @param pkey
 * @param loginPassword
 * @param firstName
 * @param lastName
 * @param userType
 * @returns {*}
 */
UserDAO.prototype.updateUserDetails = function (pkey, firstName, lastName, address) {
    var self = this;
    return this.dbQuery("UPDATE " + tableName +
    " SET " +
    " first_name=$1," +
    " last_name=$2," +
    " address = $3" +
    " WHERE _id=$4", [ firstName, lastName, address, pkey])
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "updateUserDetails", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        });
};

/**
 * Clear email verification code as verification has been successful. for given user_id
 *
 * @param _id
 * @returns {*}
 */
UserDAO.prototype.clearVerificationCode = function (_id) {
    var self = this;
    return this.dbQuery("UPDATE " + tableName + "" +
    " SET email_verification=$1" +
    " WHERE _id=$2", [null, _id])
        .then(function (result) {
            return result.rowCount;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "insertRegistrationData", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));

        });
};

/**
 * This method retrieves user data based on verification code. Used for email verification step.
 *
 * @param verifCode
 * @returns {*}
 */
UserDAO.prototype.getUserDetailsByCode = function (verifCode) {
    var self = this;
    return this.dbQuery("SELECT email_address,email_verification,mobile_no" +
    " FROM " + tableName +
    " WHERE email_verification=$1", [verifCode])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.log.call(self, "getUserDetailsByCode", error.message, "error");
            return Q.reject(navnirmiteeApi.util.getErrorObject(error, 500, "DBUSER", navDatabaseException));
        })
};

