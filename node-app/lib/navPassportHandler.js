var LocalStrategy = require('passport-local').Strategy,
    Q = require('q'),
    navUserNotFoundException = require(process.cwd() + "/lib/exceptions/navUserNotFoundException.js"),
    UserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js");

module.exports = class navPassportHandler {
    constructor(p) {
        p.serializeUser(this.serializeUser);
        // used to deserialize the user
        p.deserializeUser(this.deserializeUser);
        p.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, this.authenticate)); 
    }

    serializeUser (user, done) {
        //console.log("User Details while serialize : ", user);
        done(null, {userId: user.email_address});
    }
    deserializeUser(user, done) {
        return (new UserDAO()).getLoginDetails(user.userId)
            .then(function (userData) {
                if (userData.length != 0) {
                    if (userData[0].email_address == user.userId) {
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
    }

    authenticate(email, password, done) {
        return (new UserDAO()).getLoginDetails(email)
            .then(function (user) {
                if (user.length != 0) {
                    if (password && navnirmiteeApi.util.comparePassword(password, user[0].password)) {
                        return done(null, user[0]);
                    } else {
                        return done(new navUserNotFoundException());
                    }
                } else {
                    return done(new navUserNotFoundException());
                }
            })
        .catch(function (error) {
            return done(error);
        });
    }
}

