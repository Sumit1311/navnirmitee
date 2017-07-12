const NE = require('node-exceptions')
class navPendingReturnException extends NE.LogicalException {
    constructor() {
        super("You can only order one toy at a time. Please cancel it by going to My Orders page if you don't want it", 400, "DUPLICATE_ORDER");
    }
}
 
module.exports = navPendingReturnException; 
