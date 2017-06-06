/**
 * Created by iMitesh on 17/05/16.
 */
var express = require('express'),
    navnirmiteeApi = require(process.cwd() + "/lib/api.js");
var router = express.Router(),
    url = require("url"),
    Q = require('q'),
    moment = require('moment'),
    UserDAO = require(process.cwd() + "/dao/user/masterDAO.js");


router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

/*router.get('/homeMain', function (req, res) {
    res.render('homeMain');
});*/

/*router.post('/follow', isSameUser, function (req, res) {
    var emailId = req.body.email, userDetails = req.user;
    (new UserDAO()).getLoginDetails(emailId)
        .then(function (userFollow) {
            if (userFollow && userFollow.length != 0) {
                var followerId = userFollow[0]._id
                return (new UserFollowers()).addFollower(userFollow[0]._id, userDetails._id)
            } else {
                return Q.resolve();
            }
        })
        .then(function () {
            res.status(200).send(JSON.stringify({"code": "ok"}))
        })
        .catch(function (error) {
            if (error instanceof  Error) {
                navnirmiteeApi.logger.error('[user] [/follow] Error occured ', error.stack);
            } else {
                navnirmiteeApi.logger.error('[user] [/follow] Error occured ', error);
            }
            res.status(500).send("Internal Server Error");
        });
});

router.post('/unfollow', isSameUser, function (req, res) {
    var emailId = req.body.email, userDetails = req.user;

    (new UserDAO()).getLoginDetails(emailId)
        .then(function (userFollow) {
            if (userFollow && userFollow.length != 0) {
                var followerId = userFollow[0]._id;
                return (new UserFollowers()).removeFollower(userFollow[0]._id, userDetails._id)
            } else {
                return Q.resolve();
            }
        })
        .then(function () {
            res.status(200).send(JSON.stringify({"code": "ok"}))
        })
        .catch(function (error) {
            if (error instanceof  Error) {
                navnirmiteeApi.logger.error('[users] [/follow] Error occured ', error.stack);
            } else {
                navnirmiteeApi.logger.error('[users] [/follow] Error occured ', error);
            }
            res.status(500).send("Internal Server Error");
        });
});*/

module.exports = router;

function isSameUser(req, res, next) {
    var emailId = req.body.email, userDetails = req.user;
    if (emailId == userDetails.login_email_id) {
        res.status(400).send(JSON.stringify({
            code: "SameEmailId"
        }));
    } else {
        next();
    }
}
