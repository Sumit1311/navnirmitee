var uuid = require('node-uuid');
const url = require('url');

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
	if(timeInMilis) {
		return moment(timeInMilis).format("ddd, MMM Do YYYY");
	} else {
		return "";
	}
    }

    getBaseURL(req) {
	var base = new url.Url();
	base.protocol = req.protocol;
	base.host = req.get("host");
	return base;
    }    
}

