var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var navConfigParser = require(process.cwd() + "/lib/navConfigParser.js");
var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js");
var morgan = require('morgan');
module.exports = class navAppInitializer {

    constructor() {

    }

    init () {
            var app = express();
            // BodyParser Middleware
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({extended: false}));
            app.use(cookieParser());
            // Set Static Folder
            app.use(express.static(path.join(__dirname, '../public')));
            // Express Validator
            app.use(expressValidator({
                customValidators : {
                    isValidPassword: function(input){
                        return true;
                    }
                },
                errorFormatter: function (param, msg, value) {
                    var namespace = param.split('.')
                    , root = namespace.shift()
                    , formParam = root;

                    while (namespace.length) {
                        formParam += '[' + namespace.shift() + ']';
                    }
                    var errors = {}
                    errors = {
                        param : formParam,
                        msg : msg,
                        value : value
                    }
                    return errors;
                }
            }));

            // Connect Flash
            app.use(flash());
            app.use(morgan('combined'));
            return app;

    }

    start(app) {
            var self = this;
                    // Set Port
            app.set('port', navConfigParser.instance().getConfig("ListeningPort",3000));
            app.listen(app.get('port'), function () {
                navLogUtil.instance().log.call(self,"start",'Server started on port ' + app.get('port'), "info");
            });

    }
}
