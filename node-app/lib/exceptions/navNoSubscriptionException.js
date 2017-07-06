const NE = require('node-exceptions')
class navValidationException extends NE.LogicalException {
    constructor() {
        super("Please recharge <a href=\"/user/rechargeDetails\">Recharge Now</a>", 400, "NO_SUBSCRIPTION");
    }
}
 
module.exports = navValidationException; 
