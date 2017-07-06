var TYPE ={
    RENT : "debit",
    PAYMENTS : "credit"
};

var navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js");

module.exports = class navTransactions {
    static getType() {
        return TYPE;
    }
    static createObject(context, type){
        if(type == TYPE.RENT) {
            return {
		dateMilis : parseInt(context.transaction_date),
                transactionDate : new navCommonUtil().getDateString(parseInt(context.transaction_date)),
                summary : "Rented Toy : "+context.name,
                amountDeducted : context.price,
		transactionStatus : context.status
            };
        }
        else if(type == TYPE.PAYMENTS) {
            return {
		dateMilis : parseInt(context.paid_date),
                transactionDate : new navCommonUtil().getDateString(parseInt(context.paid_date)),
                summary : context.reason,
                amountPaid : context.amount_payable,
		transactionStatus : context.status
		
            };
        }
    }


}
