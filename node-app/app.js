var express = require('express');
var path = require('path');
var redis = require("redis");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var hbshelpers = require('handlebars-helpers')
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var client;
if (process.env.REDISCLOUD_URL) {
    client = redis.createClient(process.env.REDISCLOUD_URL);
} else {
    client = redis.createClient();
}
var passport = require('passport');
var SetupDB = require(process.cwd() + "/dao/setupDB.js");
var navnirmiteeApi = require(process.cwd() + "/lib/api.js");
/*
 var LocalStrategy = require('passport-local').Strategy;
 var mysql = require('mysql');
 */
//mongoose.connect('mongodb://localhost/loginapp');
//var db = mongoose.connection;
var users = require('./routes/users.js');
var morgan = require('morgan');

// Init App
var app = express();
//create schema for app
var setupDB = new SetupDB();
setupDB.setupSchema()
    .then(function () {
        var hbs = exphbs.create({
            defaultLayout: 'layout'
        });
        hbshelpers({
            handlebars: hbs.handlebars
        });
        require(process.cwd() + "/lib/passport.js")(passport);

        app.set('views', path.join(__dirname, 'views'));
        app.engine('handlebars', hbs.engine);
        app.set('view engine', 'handlebars');

// BodyParser Middleware
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(cookieParser());

// Set Static Folder
//       app.use(express.static(path.join(__dirname, 'public')));

// Express Session
        app.use(session({
            secret: 'session_secret',
            // create new redis store.
            store: new redisStore({
                client: client, ttl: 181440000
            }),
            saveUninitialized: false,
            resave: false
        }));

// Passport init
        app.use(passport.initialize());
        app.use(passport.session());

// Express Validator
        app.use(expressValidator({
            errorFormatter: function (param, msg, value) {
                var namespace = param.split('.')
                    , root = namespace.shift()
                    , formParam = root;

                while (namespace.length) {
                    formParam += '[' + namespace.shift() + ']';
                }
                return {
                    param: formParam,
                    msg: msg,
                    value: value
                };
            }
        }));

// Connect Flash
        app.use(flash());
        app.use(morgan('combined'));

// Global Vars
        app.use(function (req, res, next) {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user || null;
            next();
        });

        app.use('/', require('./routes/regAndAuth/login.js'));
        app.use('/registration', require('./routes/regAndAuth/registration.js'));
        app.use('/user', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/user.js'));
        /*app.use('/amenities', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/amenities.js'));
        app.use('/committee', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/committee.js'));
        app.use('/community', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/community.js'));
        app.use('/grievances', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/grievances.js'));
        app.use('/forum', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/forum.js'));
        app.use('/rules', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/rules.js'));
        app.use('/contacts', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/contacts.js'));
        app.use('/todo', navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            require('./routes/society/todo.js'));
        app.use('/configure/society',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/society.js'));
        app.use('/configure/management',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/management.js'));
        app.use('/configure/events',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/events.js'));
        app.use('/configure/financial',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/financial.js'));
        app.use('/configure/notifications',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/notifications.js'));
        app.use('/configure/vendors',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/vendors.js'));
        app.use('/configure/amenities',
            navnirmiteeApi.util.ensureAuthenticated,
            navnirmiteeApi.util.isSessionAvailable,
            navnirmiteeApi.util.isAuthorized,
            require('./routes/configure/amenities.js'));*/

        //app.use('/users', users);

// Set Port
        app.set('port', (process.env.PORT || 3000));

        app.listen(app.get('port'), function () {
            navnirmiteeApi.logger.info('Server started on port ' + app.get('port'));
        });
    }, function (error) {
        navnirmiteeApi.logger.fatal("Error setting up database", error);
        process.exit(-1);
    });
/*

 var https = require("https");
 function processRequest(req, res){
 res.end("Hello world");
 }
 var s = https.createServer(processRequest);
 s.listen(8090);*/
