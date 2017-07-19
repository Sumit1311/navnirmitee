var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navPGRouter = require(process.cwd() + "/lib/navPGRouter.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');

module.exports = class navProcessTransactions {
    constructor() {
    }

    processPendingTransactions() {
        var self = this; 
        return new navPaymentsDAO().getNextPendingTransaction()
            .then(function(transactionDetails){
                if(transactionDetails.length != 0) {
                    return navPGRouter.checkStatus(transactionDetails[0].transaction_id);   
                }
                else {
                    return Q.resolve();
                } 
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, "processPendingTransactions","Error : " + error, "error");
                return Q.resolve();
            })
    }
}
