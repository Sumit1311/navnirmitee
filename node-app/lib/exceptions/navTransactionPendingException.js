const NE = require('node-exceptions')
class navTransactionPendingException extends NE.LogicalException {
    constructor() {
        super("Transaction is in pending state at gateway... Please check your wallet for status of the transactions",400,"VERIFY_EMAIL");
    }

}
 
module.exports = navTransactionPendingException; 
