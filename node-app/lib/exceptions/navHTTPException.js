const NE = require('node-exceptions')
module.exports = class navPGFailureException extends NE.LogicalException {
    constructor(body, status) {
        super(body.message || JSON.stringify(body), status,"REQUEST_FAILED");
    }

}
