/**
 * navPaymentsDAO --
 *  Used to interact with the table user_master. Has methods for CRUD operations on this table.
 *
 */

"use strict";

var BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navPasswordUtil = require(process.cwd() + "/lib/navPasswordUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    util = require("util");

var tableName = "nav_payments";

module.exports = class navPaymentsDAO extends BaseDAO{
    constructor(client, persistence) {
        super(persistence);
        this.providedClient = client;
        this.REASON = {
            DEPOSIT : "DEPOSIT",
            RECH100 : "RECH100"
        }
        this.STATUS = {
            PENDING : "PENDING"
        }
    }

    insertPaymentDetails(userId, amount, reason, paymentStatus) {
        var self = this;
        return this.dbQuery("INSERT INTO "+ tableName + " (_id, user_id,amount_payable, reason, credit_date, status) VALUES($1, $2, $3, $4, $5, $6)",
                [new navCommonUtil().generateUuid(), userId, amount, reason, new Date().getTime(), paymentStatus])
            .then(function (result) {
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "insertPaymentDetails", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });

    }

}



//private variables


