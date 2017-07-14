var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navPGRouter = require(process.cwdd() + "/lib/navPGRouter.js");

module.exports = class navProcessTransactions {
    constructor() {
    }

    processPendingTransactions() {
        
        new navPaymentsDAO().getNextPendingTransaction()
           .then(function(transactionDetails){
                
           }) 
    }
}
