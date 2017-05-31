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
    util = require("util");

function UserDAO(persistence, client) {
    if (persistence) {
        BaseDAO.call(this, persistence);
    }
    this.providedClient = client ? client : undefined;
    return this;
}

util.inherits(UserDAO, BaseDAO);

module.exports = UserDAO;
//private variables
var tableName = "user_master",
    rootUserId = "45058a54-b3e2-4a3b-96ab-c13dcf3023e3",
    fileName = 'user/masterDAO';

/**
 * Get login details for the user specified by loginName
 *
 * @returns {*}
 */
UserDAO.prototype.getLoginDetails = function (loginName) {
    return this.dbQuery("SELECT _id,login_password,email_verification,login_email_id,mobile_no,first_name,last_name,user_type" +
    " FROM " + tableName + " WHERE login_email_id=$1", [loginName])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'getUser', error);
            return Q.reject(error);
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
                return self.dbQuery('INSERT INTO ' + tableName + '(_id,first_name,user_type,login_email_id,login_password) ' +
                'VALUES($1,$2,$3,$4,$5)', [rootUserId, "Admin", navnirmiteeApi.constants.userRoleMapping.SUPER_ADMIN, "_root_@localhost.com", navnirmiteeApi.util.encryptPassword("_toor_")]);
            } else {
                return Q.resolve();
            }
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'createRootUser', error);
            return Q.reject(error);
        });
};

/**
 * This method retireves email verification details for the given user
 *
 * @param email : user's email id
 * @returns {*}
 */
UserDAO.prototype.getEmailVerificationDetails = function (email) {
    return this.dbQuery("select login_email_id,mobile_no,email_verification " +
    "from " + tableName + " where login_email_id = $1", [email])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'getEmailVerificationDetails', error);
            return Q.reject(error);
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
UserDAO.prototype.insertRegistrationData = function (email, phone, verificationCode) {
    return this.dbQuery("INSERT INTO " + tableName +
    " (_id,login_email_id,mobile_no,email_verification)" +
    " VALUES($1,$2,$3,$4)", [navnirmiteeApi.util.uuid(), email, phone, verificationCode])
        .then(function (result) {
            return result.rowCount;
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'insertRegistrationData', error);
            return Q.reject(error);
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
UserDAO.prototype.updateUserDetails = function (pkey, loginPassword, firstName, lastName, userType) {
    return this.dbQuery("UPDATE " + tableName +
    " SET login_password=$1," +
    " first_name=$2," +
    " last_name=$3," +
    " user_type=$4" +
    " WHERE _id=$5", [navnirmiteeApi.util.encryptPassword(loginPassword), firstName, lastName, userType, pkey])
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'updateUserDetails', error);
            return Q.reject(error);
        });
};

/**
 * Clear email verification code as verification has been successful. for given user_id
 *
 * @param _id
 * @returns {*}
 */
UserDAO.prototype.clearVerificationCode = function (_id) {
    return this.dbQuery("UPDATE " + tableName + "" +
    " SET email_verification=$1" +
    " WHERE _id=$2", [null, _id])
        .then(function (result) {
            return result.rowCount;
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'clearVerificationCode', error);
            return Q.reject(error);
        });
};

/**
 * This method retrieves user data based on verification code. Used for email verification step.
 *
 * @param verifCode
 * @returns {*}
 */
UserDAO.prototype.getUserDetailsByCode = function (verifCode) {
    return this.dbQuery("SELECT login_email_id,email_verification,mobile_no" +
    " FROM " + tableName +
    " WHERE email_verification=$1", [verifCode])
        .then(function (result) {
            return result.rows;
        })
        .catch(function (error) {
            navnirmiteeApi.util.logError(fileName, 'getUserDetailsByCode', error);
            return Q.reject(error);
        })
};

