const NE = require('node-exceptions')
class navValidationException extends NE.LogicalException {
    constructor() {
        super("Please recharge <a href=\"/pricing\">Recharge Now</a>", 400, "INSUFFICIENT_BALANCE");
    }
}
 
module.exports = navValidationException; 
