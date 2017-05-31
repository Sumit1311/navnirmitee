"use strict";

var navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    LocalStrategy = require('passport-local').Strategy,
    Q = require('q'),
    UserDAO = require(process.cwd() + "/dao/user/masterDAO.js");

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        //console.log("User Details while serialize : ", user);
        done(null, {userId: user.login_email_id});
    });

    // used to deserialize the user
    passport.deserializeUser(function (user, done) {
        return (new UserDAO()).getLoginDetails(user.userId)
            .then(function (userData) {
                if (userData.length != 0) {
                    if (userData[0].login_email_id == user.userId) {
                        return done(null, userData[0]);
                    } else {
                        return done(null, false);
                    }
                } else {
                    return done(null, false);
                }
            })
            .catch(function (error) {
                return done(error);
            });
    });

    //the callback is used to authenticate user
    passport.use(new LocalStrategy({
            usernameField: 'userName',
            passwordField: 'password'
        }, function (userName, password, done) {
            //console.info("Fetching from DB.....", email, password);
            return (new UserDAO()).getLoginDetails(userName)
                .then(function (user) {
                    if (user.length != 0) {
                        if (password && navnirmiteeApi.util.comparePassword(password, user[0].login_password)) {
                            return done(null, user[0]);
                        } else {
                            return done(null, false);
                        }
                    } else {
                        return done(null, false);
                    }
                })
                .catch(function (error) {
                    return done(error);
                });
        })
    );

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    // 
    /*passport.use('local-signup', new LocalStrategy({
     // by default, local strategy uses username and password, we will override with email
     usernameField : 'email',
     passwordField : 'password',
     passReqToCallback : true // allows us to pass back the entire request to the callback
     },
     function(req, email, password, done) {

     // asynchronous
     // User.findOne wont fire unless data is sent back
     process.nextTick(function() {

     // find a user whose email is the same as the forms email
     // we are checking to see if the user trying to login already exists
     User.findOne({ 'local.email' :  email }, function(err, user) {
     // if there are any errors, return the error
     if (err)
     return done(err);

     // check to see if theres already a user with that email
     if (user) {
     return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
     } else {

     // if there is no user with that email
     // create the user
     var newUser            = new User();

     // set the user's local credentials
     newUser.local.email    = email;
     newUser.local.password = newUser.generateHash(password);

     // save the user
     newUser.save(function(err) {
     if (err)
     throw err;
     return done(null, newUser);
     });
     }

     });

     });
     */
};