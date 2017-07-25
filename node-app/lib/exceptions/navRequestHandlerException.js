const NE = require('node-exceptions')
module.exports = class navPGFailureException extends NE.LogicalException {
    constructor(error) {
        if(error) {
            super(error.messsage, 0, error.code);
        } else {
            super("Request Failed", 0, "Request_FAILED");
        }
    }

}
