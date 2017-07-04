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
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    util = require("util");

var tableName = "nav_payments";

module.exports = class navPaymentsDAO extends BaseDAO{
    constructor(client, persistence) {
        super(persistence);
        this.providedClient = client;
        var plans = navMembershipParser.instance().getConfig('plans');
        this.REASON = {
            DEPOSIT : "DEPOSIT",
            REGISTRATION :"REGISTRATION_FEES",
            PLANS : []
        }
        for(var i = 0; i < plans.length; i++)
        {
            this.REASON.PLANS[i] = [];
            for(var j = 0; j < plans[0].length; j++)
            {
                this.REASON.PLANS[i][j] = "RECH_"+ i + "::" + plans[i][j].id;
            }
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

     getAllPaymentTransactions(userId) {
        var self = this;
        return this.dbQuery("SELECT reason, paid_date, amount_payable from " + tableName + " WHERE user_id = $1 AND status = $2 AND reason != $3 AND reason != $4", [userId, this.STATUS.PENDING, this.REASON.DEPOSIT, this.REASON.REGISTRATION])
            .then(function (result) {
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllRentTransactions", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
     }

}



//private variables

