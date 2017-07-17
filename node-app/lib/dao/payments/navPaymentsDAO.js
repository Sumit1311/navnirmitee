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
var STATUS = {
    PENDING : "PENDING",
    COMPLETED : "COMPLETED",
    CANCELLED : "CANCELLED",
    FAILED : "FAILED",
    TRANSACTION_FAILED : "TXN_FAILED"
}
var REASON = {
            DEPOSIT : "DEPOSIT",
            REGISTRATION :"REGISTRATION_FEES",
            PLANS : []
        };

module.exports = class navPaymentsDAO extends BaseDAO{
    constructor(client, persistence) {
	super(persistence);
        this.providedClient = client;
        var plans = navMembershipParser.instance().getConfig('plans');
        for(var i = 0; i < plans.length; i++)
        {
            REASON.PLANS[i] = [];
            for(var j = 0; j < plans[0].length; j++)
            {
                REASON.PLANS[i][j] = "RECH_"+ i + "::" + plans[i][j].id;
            }
        }
        this.STATUS = STATUS;
	this.REASON = REASON;
    }

    static getStatus(){
	return STATUS;	
    }

    static getReason(){
	return REASON;
    }
    insertPaymentDetails(userId, amount, reason, paymentStatus, orderId) {
        var self = this;
        return this.dbQuery("INSERT INTO "+ tableName + " (_id, user_id,amount_payable, reason, credit_date, status, transaction_id) VALUES($1, $2, $3, $4, $5, $6, $7)",
                [new navCommonUtil().generateUuid(), userId, amount, reason, new Date().getTime(), paymentStatus, orderId])
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
        return this.dbQuery("SELECT reason, paid_date, amount_payable, status from " + tableName + " WHERE user_id = $1 AND reason != $2 AND reason != $3", [userId, this.REASON.DEPOSIT, this.REASON.REGISTRATION])
            .then(function (result) {
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllRentTransactions", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
     }
     updatePaymentDetails(orderId, summary, status, paid_date, retryDate, expirationDate) {
         var self = this;
         var count = 0;
         //	console.log(summary, status, orderId);
         var queryString = "UPDATE "+tableName + " SET status = $1, transaction_summary = $2, paid_date = $3";
         var params = [status, summary, paid_date];
         count = 4;
         if(retryDate) {
             queryString += " next_retry_date = $" + (count);
             params.push(retryDate);
             count++;
         }
         if(expirationDate) {
             queryString += " expiration_date = $" + (count);
             params.push(expirationDate);
             count++;
         }
         queryString += " WHERE transaction_id = $" + (count);
         params.push(orderId);
         count++;
         return this.dbQuery(queryString, params)
             .then(function (result) {
                 return result.rows;
             })
         .catch(function (error) {
             navLogUtil.instance().log.call(self, "updatePaymentDetails", error.message, "error");
             return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
         });
     }
     getPaymentsByTransactionId(orderId) {        
         var self = this;
        return this.dbQuery("SELECT reason, amount_payable, user_id from " + tableName + " WHERE transaction_id = $1 AND (status != $2 OR status != $3)", [orderId, this.STATUS.PENDING, this.STATUS.COMPLETED])
            .then(function (result) {
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getAllRentTransactions", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
     }

     getNextPendingTransaction() {
         var self = this;
         return this.dbQuery("SELECT amount_payable, transaction_id, user_id from " + tableName + " WHERE status = $1 AND next_retry_date <= $2 AND expiration_date > $2 ORDER BY next_retry_date LIMIT 1;", [this.STATUS.PENDING, new Date().getTime()])
             .then(function (result) {
                 return result.rows;
             })
         .catch(function (error) {
             navLogUtil.instance().log.call(self, "getNextPendingTransaction", error.message, "error");
             return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
         });
        
     }
}



//private variables


