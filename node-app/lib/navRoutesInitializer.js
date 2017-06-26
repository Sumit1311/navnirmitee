module.exports = class navRoutesInitializer {
    init(app) {
            // Global Vars
            app.use(function (req, res, next) {
                res.locals.success_msg = req.flash('success_msg');
                res.locals.error_msg = req.flash('error_msg');
                res.locals.error = req.flash('error');
                res.locals.user = req.user || null;
                next();
            });
            app.use('/ping',function(req,res){
                res.status(200).send('pong');
            });
            app.use('/', require(process.cwd() + '/routes/regAndAuth/login.js'));
            app.use('/', require(process.cwd() + '/routes/temp.js'));	
            //app.use('/registration', require('./routes/regAndAuth/registration.js'));
            app.use('/user', 
                    navnirmiteeApi.util.ensureVerified, 
                    navnirmiteeApi.util.ensureAuthenticated,
                    navnirmiteeApi.util.isSessionAvailable,
                    require(process.cwd() + '/routes/user/user.js'));
            app.use('/toys', 
                    navnirmiteeApi.util.ensureVerified,
                    navnirmiteeApi.util.ensureAuthenticated,
                    navnirmiteeApi.util.isSessionAvailable,
                    require(process.cwd() + '/routes/toys/toyDetail.js'));
        
    }
}
