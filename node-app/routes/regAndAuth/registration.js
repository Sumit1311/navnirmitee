/**
 * This file defines the routes for the registration functionality
 * and all the routes
 * will be accessed as http://<domain_name>/registration/<route_name>
 */
var express = require('express'),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js");
var router = express.Router(),
    passport = require('passport'),
    url = require("url"),
    UserDAO = require(process.cwd() + "/dao/user/masterDAO.js");

/**
 * used to verify email address of the user this route expects verification code as query parameter
 * If successfully verified it redirects user to second step of registration page
 */
router.get('/verify', function (req, res) {
    var code = req.query.id;
    (new UserDAO()).getUserDetailsByCode(code)
        .then(function (userDetails) {
            if (userDetails != 0) {
                res.redirect('/registration/details?login=' + userDetails[0].login_email_id + "&id=" + userDetails[0].email_verification + "&mobile=" + userDetails[0].mobile_no);
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

/**
 * This route renders the page for first step of registration process
 */
router.get('/first', function (req, res) {
    res.render('register');
});

/**
 * This route accepts the data for first step of registration. and completes the first step
 *
 */
router.post('/first', function (req, res) {
    //res.render('registration');
    var body = req.body;
    if (body.email && body.mobile_no) {
        var userDAO = new UserDAO();
        userDAO.getEmailVerificationDetails(body.email)
            .then(function (emailDetails) {
                if (emailDetails.length == 0) {
                    //send email
                    var verificationCode = navnirmiteeApi.util.generateEmailVerificationCode();

                    var verificationLink = req.protocol + "://" + req.get("host") + "/registration/verify?id=" + verificationCode;
                    return userDAO.insertRegistrationData(body.email, body.mobile_no, verificationCode)
                        .then(function () {
                            res.redirect("/registration/details?login=" + body.email + "&mobile=" + body.mobile_no);
                        })
                    //todo : uncomment when want to send verification email
                    /*navnirmiteeApi.email.sendVerificationEmail(body.email, null, verificationLink)
                     .then(function (response) {
                     navnirmiteeApi.logger.debug("[users] [/register] Sent verificiation email", response);
                     return userDAO.insertRegistrationData(body.email, body.mobile_no, verificationCode);
                     })
                     .then(function () {
                     res.status(200).send("<html><title>Registration Success</title><body>Thanks. <br> Verification email sent successfully." +
                     " Please verify email addresss</body></html>");
                     })
                     .catch(function (error) {
                     navnirmiteeApi.logger.error("[users] [/register] Error sending verificiation email", error);
                     res.status(500).send({"code": "InternalServerError"});
                     });*/

                } else {
                    return res.status(400).send({"code": "EmailAlreadyRegistered"});
                }
            })

    } else {
        // send error
        res.status(400).send({"error": "Bad Request"});
    }

});

/**
 * This route renders second step registration page
 *
 */
router.get("/details", function (req, res) {
    var body = req.query;
    res.render('registration', {
        emailId: body.login ? body.login : "",
        code: body.id ? true : false,
        mobileNo: body.mobile ? body.mobile : ""
    });
});

/**
 * Completes the second step of registration along with clearing verification email.
 */
router.post("/details", function (req, res) {
    var body = req.body;
    var loginEmailId = body.userName,
        loginPassword = body.password,
        confirmPassword = body.confirm,
        firstName = body.name,
        lastName = body.surname,
        address = body.address,
        dateOfBirth = body.dob,
        gender = body.gender,
        pinCode = body.pinCode,
        isVerification = body.verifCode;
    var userDAO = new UserDAO(),
        client, user;

    if ((loginPassword != confirmPassword)) {
        res.status(400).send("Bad Request");
        return;
    }
    userDAO.getClient()
        .then(function (_client) {
            userDAO.providedClient = _client;
            return userDAO.startTx();
        })
        .then(function () {
            return userDAO.getLoginDetails(loginEmailId);
        })
        .then(function (_user) {
            user = _user[0];
            return userDAO.clearVerificationCode(user._id)
        })
        //todo : uncomment once email verification done and comment above then
        /*.then(function () {
         user = userDetails[0];
         if (loginEmailId != user.login_email_id) {
         return Q.reject({
         status: 400,
         body: "Bad Request"
         });
         }
         if (user.email_verification != NULL) {
         if (isVerification == true) {
         return userDAO.clearVerificationCode(user.email_verification)
         } else {
         return Q.reject({
         status: 400,
         body: "Please verify email first.."
         });
         }
         } else {
         if (isVerification == true) {
         return Q.reject({
         status: 400,
         body: "Bad Request"
         });
         } else {
         return Q.resolve();
         }
         }
         })*/
        .then(function () {
            return userDAO.updateUserDetails(user._id, loginPassword, firstName, lastName, navnirmiteeApi.constants.userRoleMapping.GENERAL_USER);
        })
        .then(function () {
            return userDAO.commitTx();
        })
        .then(function () {
            res.redirect("/user/login");
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
        });
});

module.exports = router;