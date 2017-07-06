var that, logger;

module.exports = class navLogUtil {
    constructor() {
        logger = require("log4js").getLogger("navnirmitee");
        logger.setLevel(process.env.LOG_LEVEL || "INFO");
    }
    log (functionName, message, level){
        logger[level]("["+ this.constructor.name +"] ["+ functionName  +"] " + message );
    }
    getLogger() {
        return logger;
    }
    static instance() {
        if(that){
            return that;
        }
        else{
            return (that = new navLogUtil());
        }

    }

}



