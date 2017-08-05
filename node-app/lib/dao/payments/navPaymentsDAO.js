/**
 * navPaymentsDAO --
 *  Used to interact with the table user_master. Has methods for CRUD operations on this table.
 *
 */

"use strict";

var BaseDAO = require(process.cwd() + "/lib/dao/base/baseDAO.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    moment = require('moment'),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    Q = require("q"),
    navDatabaseException = require(process.cwd()+'/lib/dao/exceptions/navDatabaseException.js'),
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js");

var tableName = "nav_payments";
var STATUS = {
    PENDING : "PENDING",
    PENDING_COD : "CASH",
    COMPLETED : "COMPLETED",
    COMPLETED_CASH : "COMPLETED",
    CANCELLED : "CANCELLED",
    FAILED : "FAILED",
    TRANSACTION_FAILED : "TXN_FAILED"
}
var REASON = {
    DEPOSIT : "DEPOSIT",
    REGISTRATION :"REGISTRATION_FEES",
    PLANS : []
};

var TRANSACTION_TYPE = {
    PAYTM : "Paytm",
    CASH :"Cash on Deliver"
}

var plans = navMembershipParser.instance().getConfig('plans');
for(var i = 0; i < plans.length; i++)
{
    REASON.PLANS[i] = [];
    for(var j = 0; j < plans[0].length; j++)
    {
        REASON.PLANS[i][j] = "RECH_"+ i + "::" + plans[i][j].id;
    }
}
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
        this.TRANSACTION_TYPE = TRANSACTION_TYPE;
    }

    static getStatus(){
        return STATUS;	
    }

    static getReason(){
        return REASON;
    }
    insertPaymentDetails(userId, amount, reason, paymentStatus, orderId, transactionStatus) {
        var self = this;
        var queryString1 = "INSERT INTO "+ tableName + " (_id, user_id,amount_payable, reason, credit_date, status, transaction_id, transaction_type"; 
        var query2 = " VALUES($1, $2, $3, $4, $5, $6, $7, $8";
        var params = [new navCommonUtil().generateUuid(), userId, amount, reason, new Date().getTime(), paymentStatus, orderId, transactionStatus];
        var count = 8;
        if(paymentStatus == STATUS.PENDING) {
            queryString1 += ", next_retry_date, expiration_date"
                query2 += ", $" + (++count);
            query2 += ", $" + (++count);
            params.push(moment().add(navConfigParser.instance().getConfig("PaymentGateway").RetryInterval, "hours").valueOf() );
            params.push(moment().add(navConfigParser.instance().getConfig("PaymentGateway").ExpirationInterval, "hours").valueOf());
        }
        queryString1 += ") ";
        query2 += ")";
        navLogUtil.instance().log.call(this, "insertPaymentDetails", " Payment for user : "+ userId + " with orderId "+ orderId +" for amount "+amount+" has status "+ transactionStatus , "debug");
        return this.dbQuery(queryString1+query2, params)
            .then(function (result) {
                navLogUtil.instance().log.call(self, "insertPaymentDetails", " No of records inserted :  "+ result.rowCount , "debug");
                return result.rowCount;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "insertPaymentDetails", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });

    }

    getAllPaymentTransactions(userId) {
        var self = this;
        navLogUtil.instance().log.call(this, "getAllPaymentTransactions", " Fetching all Payment details for user : "+ userId + " except for reasons "+ this.REASON.DEPOSIT + this.REASON.REGISTRATION, "debug");
        return this.dbQuery("SELECT reason, paid_date, amount_payable, status from " + tableName + " WHERE user_id = $1 AND reason != $2 AND reason != $3", [userId, this.REASON.DEPOSIT, this.REASON.REGISTRATION])
            .then(function (result) {
                navLogUtil.instance().log.call(self, "getAllPaymentTransactions", "No of transactions fetched : "+result.rowCount,"debug");

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
        if(retryDate !== undefined && retryDate !== null) {
            queryString += ", next_retry_date = $" + (count);
            params.push(retryDate);
            count++;
        }
        if(expirationDate !== undefined && expirationDate !== null) {
            queryString += ", expiration_date = $" + (count);
            params.push(expirationDate);
            count++;
        }
        queryString += " WHERE transaction_id = $" + (count);
        params.push(orderId);
        count++;
        navLogUtil.instance().log.call(this, "updatePaymentDetails", " Transaction Id : "+ orderId + " has status "+ status , "debug");
        return this.dbQuery(queryString, params)
            .then(function (result) {
                navLogUtil.instance().log.call(self, "getAllPaymentTransactions", "No of records updated : "+result.rowCount,"debug");
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "updatePaymentDetails", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }
    getPaymentsByTransactionId(orderId) {        
        var self = this;
        navLogUtil.instance().log.call(this, "getPaymentsByTransactionId", " Fetching payments for orderId "+ orderId , "debug");
        return this.dbQuery("SELECT reason, amount_payable, user_id from " + tableName + " WHERE transaction_id = $1 AND (status != $2 OR status != $3)", [orderId, this.STATUS.PENDING, this.STATUS.COMPLETED])
            .then(function (result) {
                navLogUtil.instance().log.call(self, "getPaymentsByTransactionId", " No of payments for orderId "+ orderId + " are " + result.rowCount, "debug");
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getPaymentsByTransactionId", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }


    getPaymentType(paymentId) {        
        var self = this;
        navLogUtil.instance().log.call(this, "getPaymentType", " Fetching payments for paymentId "+ paymentId , "debug");

        return this.dbQuery("SELECT transaction_type from " + tableName + " WHERE _id = $1", [paymentId])
            .then(function (result) {
                navLogUtil.instance().log.call(self, "getPaymentType", " No of payments for paymentId : "+ paymentId+" are " + result.rowCount, "debug");
                                
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getPaymentType", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }

    getNextPendingTransaction() {
        var self = this;
        navLogUtil.instance().log.call(this, "getNextPendingTransaction", "fetching next pending transaction", "debug");
        return this.dbQuery("SELECT amount_payable, transaction_id, user_id from " + tableName + " WHERE status = $1 AND next_retry_date <= $2 AND expiration_date > $2 ORDER BY next_retry_date LIMIT 1;", [this.STATUS.PENDING, new Date().getTime()])
            .then(function (result) {
                navLogUtil.instance().log.call(self, "getNextPendingTransaction", "No of Pending transaction : " + result.rowCount, "debug");
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "getNextPendingTransaction", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });

    }
    markExpiredTransactionAsFailed() {
        var self  = this;
        var queryString = "UPDATE "+tableName + " SET status = $1, transaction_summary = $2, expiration_date = $3 WHERE expiration_date IS NOT NULL AND expiration_date <= $3 AND status != $1";
        var params = [STATUS.TRANSACTION_FAILED, "MARKING_AS_FAILED", navCommonUtil.getCurrentTime_S()];
        return this.dbQuery(queryString, params)
            .then(function (result) {
                navLogUtil.instance().log.call(self, self.markExpiredTransactionAsFailed.name, "Marking transactions as failed "+ result.rowCount, "debug");
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "markExpiredTransactionAsFailed", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));
        });
    }
    getPaymentsCount () {
        var self = this;
        return this.dbQuery("select count(_id) AS count FROM "+tableName)
            .then(function(result){
                return result.rows;
            })
        .catch(function(error){
            navLogUtil.instance().log.call(self, "getPaymentsCount",  error.message, "error" );
            return Q.reject(new navCommonUtil().getErrorObject(error,500,"DBPAYMENT", navDatabaseException));
        });

    }
    getPaymentsFullList (offset, limit, sortBy, sortType) {
        //debugger;
        var self = this;
        var sort = sortType ? sortType : "ASC", sortCol = sortBy ? sortBy : "email_address", p_offset = offset ? offset : 0, p_limit = limit ? limit : 5;
        var params = [p_limit, p_offset];
        var queryString = "SELECT p.*, email_address FROM "+ tableName + " p INNER JOIN nav_user u ON p.user_id = u._id ORDER BY "+ sortCol + " " + sort +" LIMIT $1 OFFSET $2" 
            return this.dbQuery(queryString , params)
            .then(function(result){
                return result.rows;
            })
        .catch(function(error){
            navLogUtil.instance().log.call(self, self.getPaymentsFullList.name,  error.message, "error" );
            return Q.reject(new navCommonUtil().getErrorObject(error,500,"DBRENTAL", navDatabaseException));
        });

    }
    updatePaymentById(paymentId, status, retryDate, expirationDate) {
        var self = this;
        var query = "UPDATE "+tableName+" SET next_retry_date=$1, expiration_date=$2, status = $3 WHERE _id=$4";
        var params = [retryDate, expirationDate, status,  paymentId];
        navLogUtil.instance().log.call(self, self.updatePaymentById.name, "Update payment "+ paymentId+" with status "+status, "debug")            
        return this.dbQuery(query, params)
            .then(function (result) {
                return result.rows;
            })
        .catch(function (error) {
            navLogUtil.instance().log.call(self, "updatePaymentById", error.message, "error");
            return Q.reject(new navCommonUtil().getErrorObject(error, 500, "DBPAYMENT", navDatabaseException));

        });
    }             
}



//private variables


