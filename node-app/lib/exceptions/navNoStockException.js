const NE = require('node-exceptions')
class navNoStockException extends NE.LogicalException {
    constructor() {
        super("Item out of stock", 400, "INSUFFICIENT_STOCK");
    }
}
 
module.exports = navNoStockException; 
