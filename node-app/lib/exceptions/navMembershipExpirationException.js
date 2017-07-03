const NE = require('node-exceptions')
class navValidationException extends NE.LogicalException {
    constructor() {
        super("Please renew membership", 400, "MEMBERSHIP_EXPIRED");
    }
}
 
module.exports = navValidationException; 
