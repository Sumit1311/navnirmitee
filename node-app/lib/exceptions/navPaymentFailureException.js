const NE = require('node-exceptions')
module.exports = class navPaymentFailureException extends NE.LogicalException {
    constructor() {
        super("Transaction with the gateway has been failed", 500,"PAYMENT_FAILURE");
    }

}
