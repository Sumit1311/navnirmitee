var that, logger;

function init(_logger) {
    logger = require("log4js").getLogger(_logger ? _logger : "navnirmitee");
    logger.setLevel(process.env.LOG_LEVEL || "INFO");
}

module.exports = class navLogUtil {
    constructor() {
    }
    log (functionName, message, level){
        logger[level]("["+ this.constructor.name +"] ["+ functionName  +"] " + message );
    }
    static log (level, functionName, message){
        logger[level]("["+ this.constructor.name +"] ["+ functionName  +"] " + message );
    }
    getLogger() {
        return logger;
    }
    static instance(_logger) {
        if(typeof that === "object"){
            return that;
        }
        else{
            that = new navLogUtil(); 
            init(_logger);
            return that;
        }

    }

}



