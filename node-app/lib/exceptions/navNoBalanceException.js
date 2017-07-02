const NE = require('node-exceptions')
class navValidationException extends NE.LogicalException {
    constructor() {
        super("Insufficient Balance Please recharge by going to <a href=\"/pricing\">Recharge Now</a>", 400, "INSUFFICIENT_BALANCE");
    }
}
 
module.exports = navValidationException; 
