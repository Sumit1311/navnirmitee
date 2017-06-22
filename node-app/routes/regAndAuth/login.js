/**
 * This file defines the routes for the login functionality
 * and all the routes are root path routes i.e.
 * will be accessed as http://<domain_name>/<route_name>
 */
var express = require('express');
var router = express.Router(),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js"),
    navToysDAO = require(process.cwd() + "/dao/toys/navToysDAO.js"),
    navUserDAO = require(process.cwd() + "/dao/user/userDAO.js"),
    passport = require('passport'),
    url = require("url"),
    Q = require('q'),
    moment = require('moment');

router.get('/logout', navnirmiteeApi.util.ensureAuthenticated,
        navnirmiteeApi.util.isSessionAvailable,
        function (req, res) {
            req.session.destroy();
            res.redirect('/');
        });
router.get('/', 
        navnirmiteeApi.util.ensureVerified, 
        function (req, res) {
            var promise = Q.resolve();
            try
            {
                if(!req.user)
                {
                    promise = (new navToysDAO()).getAllToys(0,10);
                }
                else
                {
                    promise = (new navToysDAO()).getAllToys(0,10);
                }
            }
            catch(error)
            {
                
            }
            promise.then(function(toysList){
                //console.log(toysList);
                res.render('index', {
                    user : req.user,
                    isLoggedIn : req.user ? true : false,
                    layout : 'nav_bar_layout',
                    toysList : toysList
                });
            });
        });

router.post('/', passport.authenticate('local'), function (req, res) {
    return res.redirect('/');
});

//the path which will be used to login this is the route for displaying sign in page to user
router.get('/login', function (req, res) {
    //if the user is already authenticated i.e. exist in the session then continue to the home page
    if (req.isAuthenticated()) {
        if(req.user.email_verification != "")
        {
            res.render('completeRegistration',{
                isLoggedIn : true,
                layout : 'nav_bar_layout'
            });
        }
        else
        {
            res.redirect('/');
        }
    } else {
        return res.render('login',{
            layout: 'nav_bar_layout',
            hideNavBar : true
        });
    }
});

router.get('/about', function (req, res) {
    res.render('about', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });
});
router.get('/contact', function (req, res) {
    res.render('contact', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });

});
router.get('/pricing', function (req, res) {
    res.render('pricing', {
        user : req.user,
        isLoggedIn : req.user ? true : false,
        layout : 'nav_bar_layout'
    });

});
router.post('/register', function (req, res) {
    var email = req.body.email, password = req.body.password, contactNo = req.body.mobileNo;
    var userDAO = new navUserDAO();
    var verificationCode;

    userDAO.getLoginDetails(email)
        .then(function(user){
            /*if(user.length == 0)
            {
                throw new Error("User Exists");
            }*/
            verificationCode = navnirmiteeApi.util.generateEmailVerificationCode();

            var verificationLink = req.protocol + "://" + req.get("host") + "/verify?id=" + verificationCode;
            console.log("Inserting");
            //return userDAO.insertRegistrationData(email, contactNo, password,verificationCode);
                    //todo : uncomment when want to send verification email
            return navnirmiteeApi.email.sendVerificationEmail(email, null, verificationLink)
        })
        .then(function (response) {
            navnirmiteeApi.logger.debug("[users] [/register] Sent verificiation email", response);
            return userDAO.insertRegistrationData(email, contactNo, navnirmiteeApi.util.encryptPassword(password), verificationCode);
        })
        /*.then(function () {
            res.status(200).send("<html><title>Registration Success</title><body>Thanks. <br> Verification email sent successfully." +
                " Please verify email addresss</body></html>");
        })*/
        .then(function(result){
            console.log("Rendering")
            res.render('registrationSuccess',{
                layout : 'nav_bar_layout',
                isLoggedIn : req.user ? true : false,
            });
        })
        .catch(function (error) {
            navnirmiteeApi.logger.error("[users] [/register] Error sending verificiation email", error);
            res.status(500).send({"code": "InternalServerError"});
        });
});

/**
 *  * used to verify email address of the user this route expects verification code as query parameter
 *   * If successfully verified it redirects user to second step of registration page
 *    */
router.get('/verify', function (req, res) {
    var code = req.query.id;
    (new navUserDAO()).getUserDetailsByCode(code)
    .then(function (userDetails) {
        if (userDetails != 0) {
            res.render('registrationDetails',{
                layout : "nav_bar_layout",
                isLoggedIn : true,
                user : userDetails[0],
                verificationCode : userDetails[0].email_verification
            } );
        } else {
            res.status(400).send("<html><title>Invalid URL</title><body><h1>Bad Request</h1></body></html>");
        }
    })
    .catch(function (error) {
        navnirmiteeApi.logger.error('[registration] [/verify] Error occured while verifying email');
        if (error instanceof Error) {
            navnirmiteeApi.logger.error('[registration] [/verify] ', error.stack);
        }
        res.status(500).send("<html><title>Internal Server Error</title><body><h1>Internal Server Error, Try again later.</h1></body></html>");
    });
});

router.post("/registrationDetails", function(req,res) {
    var body = req.body;
    var loginEmailId = body.email,
        firstName = body.firstName,
        lastName = body.lastName,
        address = body.shippingAddress,
        verificationCode = req.query.code;
    var userDAO = new navUserDAO(),
        client, user;

    userDAO.getClient()
        .then(function (_client) {
            userDAO.providedClient = _client;
            return userDAO.startTx();
        })
        .then(function () {
            return userDAO.getLoginDetails(loginEmailId);
        })
        //todo : uncomment once email verification done and comment above then
        .then(function (userDetails) {
            user = userDetails[0];
            if (loginEmailId != user.email_address) {
                return Q.reject({
                    status: 400,
                    body: "Bad Request"
                });
            }
            if (user.email_verification == verificationCode) {
                return userDAO.clearVerificationCode(user._id)
            } else {
                return Q.reject({
                    status: 400,
                    body: "Please verify email first.."
                });
            }
        })
        .then(function () {
            return userDAO.updateUserDetails(user._id, firstName, lastName, address);
        })
        .then(function () {
            return userDAO.commitTx();
        })
        .then(function () {
            res.redirect("/login");
        })
        .catch(function (error) {
            //logg error
            navnirmiteeApi.logger.error('[users] [/registerDetails] Error while doing registration step 2', error);
            userDAO.rollBackTx()
                .then(function () {
                    res.status(500).send("Internal Server Error");
                })
                .catch(function (error) {
                    //log error
                    res.status(500).send("Internal Server Error");
                })
        })
        .finally(function () {
            if (userDAO.providedClient) {
                userDAO.providedClient.release();
                userDAO.providedClient = undefined;
            }
        })
})

module.exports = router;
