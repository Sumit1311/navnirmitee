var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    Q = require('q');

module.exports = class navProcessTransactions {
    constructor() {
    }

    processPendingTransactions() {
        
        return new navPaymentsDAO().getNextPendingTransaction()
            .then(function(transactionDetails){
                if(transactionDetails.length != 0) {
                    return navPGRouter.checkStatus(transactionDetails[0].transaction_id);   
                }
                else {
                    return Q.resolve();
                } 
            })
    }
}
