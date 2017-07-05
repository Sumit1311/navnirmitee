const NE = require('node-exceptions')
module.exports = class navPGFailureException extends NE.LogicalException {
    constructor() {
        super("Gateway Transaction Failed", 500,"PG_FAILURE");
    }

}
