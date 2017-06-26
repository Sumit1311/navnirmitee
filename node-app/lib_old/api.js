var logger = require("log4js").getLogger("livesocial");

/**
 * Set logger level as per the environmenta variable LOG_LEVEL. Default is INFO.
 *
 * @returns {Logger}
 */
function getLogger() {
    logger.setLevel(process.env.LOG_LEVEL || "INFO");
    return logger;
}

exports.logger = getLogger();


var email = require('./email.js');
//sends the verification email to the specified user.
exports.email = email;

//some general purpose utilities
var util = require('./util');
exports.util = util;

//some required constants
var constants = require('./constants');
exports.constants = constants;


/**
 * Default values are heroku db settings.
 * This object is used to store system level configurations.
 * Any global configuration should be set here and used in other files.
 * Current Configuration list :
 *   db_host, db_user,db_password,db_name,db_port
 */
exports.options = {
    db_host: process.env.DB_HOST || "localhost",
    db_user: process.env.DB_USER || "admin",
    db_password: process.env.DB_PASS || "admin",
    db_name: process.env.DB_NAME || "navnirmitee",
    db_port: process.env.DB_PORT || "5433"
}
