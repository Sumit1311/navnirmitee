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
var passport = require('passport');
var SetupDB = require(process.cwd() + "/lib/dao/setupDB.js");
var navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    navPassportHandler = require(process.cwd() + "/lib/navPassportHandler.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js");
var morgan = require('morgan');

process.on('uncaughtException', function (err) {
      console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
      console.error(err.stack)
      process.exit(-1)
})

//create schema for app
try 
{
// Init App
    var app = express();
    if (process.env.REDISCLOUD_URL) {
        client = redis.createClient(process.env.REDISCLOUD_URL);
    } else {
        client = redis.createClient();
    }
    var setupDB = new SetupDB();
    setupDB.setupSchema()
        .then(function () {
            var hbs = exphbs.create({
                //defaultLayout: 'layout',
                extname : '.hbs',
                layout : 'nav_bar_layout'

            });
            hbshelpers({
                handlebars: hbs.handlebars
            });
            (new navPassportHandler(passport));
            app.set('views', path.join(__dirname, 'views'));
            app.engine('hbs', hbs.engine);
            app.set('view engine', 'hbs');

            // BodyParser Middleware
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({extended: false}));
            app.use(cookieParser());

            // Set Static Folder
            app.use(express.static(path.join(__dirname, '../public')));

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

            // Global Vars
            app.use(function (req, res, next) {
                res.locals.success_msg = req.flash('success_msg');
                res.locals.error_msg = req.flash('error_msg');
                res.locals.error = req.flash('error');
                res.locals.user = req.user || null;
                next();
            });
            console.log("Setting up routes");
            app.use('/ping',function(req,res){
                res.status(200).send('pong');
            });
            app.use('/', require('./routes/regAndAuth/login.js'));
            app.use('/', require('./routes/temp.js'));	
            //app.use('/registration', require('./routes/regAndAuth/registration.js'));
            app.use('/user', 
                    navnirmiteeApi.util.ensureVerified, 
                    navnirmiteeApi.util.ensureAuthenticated,
                    navnirmiteeApi.util.isSessionAvailable,
                    require('./routes/user/user.js'));
            app.use('/toys', 
                    navnirmiteeApi.util.ensureVerified,
                    navnirmiteeApi.util.ensureAuthenticated,
                    navnirmiteeApi.util.isSessionAvailable,
                    require('./routes/toys/toyDetail.js'));

            // Set Port
            app.set('port', (process.env.PORT || 3000));

            app.listen(app.get('port'), function () {
                navLogUtil.instance().log.call(this,"app.js",'Server started on port ' + app.get('port'), "info");
            });
        }, function (error) {
             navLogUtil.instance().log.call(this,"app.js","Error setting up database"+ error,"fatal");
            process.exit(-1);
        })
    .done();
}
catch(error){
    navLogUtil.instance().log.call(this, "app.js", "Fatal Error Occured : " + error, "fatal");
    navLogUtil.instance().log.call(this, "app.js", "Exiting Now", "fatal");
    process.exit(-1);
}
