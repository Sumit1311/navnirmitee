var uuid = require('node-uuid');

module.exports = class navCommonUtils {
    constructor() {
        //super();

    }
    generateUuid() {
        return uuid.v4();
    }

    getErrorObject(error, status, code ,exception) {
        if(error.name != exception.name)
        {
            return new exception(error.message, status, code);
        }
        else
        {
            return error;
        }
    }

    getCurrentTime() {
        return moment().valueOf();
    }

    getDateString(timeInMilis) {
        return moment(timeInMilis).format("ddd, MMM Do YYYY");
    }

    
}

