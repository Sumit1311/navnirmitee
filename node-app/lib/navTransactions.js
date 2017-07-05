var TYPE ={
    RENT : "debit",
    PAYMENTS : "credit"
};


module.exports = class navTransactions {
    static getType() {
        return TYPE;
    }
    static createObject(context, type){
        if(type == TYPE.RENT) {
            return {
                transactionDate : context.transaction_date,
                summary : "Rented Toy : "+context.name,
                amountDeducted : context.price,
		transactionStatus : context.status
            };
        }
        else if(type == TYPE.PAYMENTS) {
            return {
                transactionDate : context.paid_date,
                summary : context.reason,
                amountPaid : context.amount_payable,
		transactionStatus : context.status
		
            };
        }
    }


}
