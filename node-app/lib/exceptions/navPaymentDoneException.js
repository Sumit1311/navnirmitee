const NE = require('node-exceptions')
module.exports = class navPaymentDoneException extends NE.LogicalException {
    constructor() {
        super("This payment is already done", 500,"DUPLICATE_REQUEST");
    }

}
