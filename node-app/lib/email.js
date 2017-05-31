var Q = require('q'),
    htmlToText = require('html-to-text'),
    navnirmiteeApi = require("./api.js"),
    nodemailer = require('nodemailer'),
    exphbs = require('express-handlebars'),
    handleBars = require('nodemailer-express-handlebars');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://postmaster%40sandboxc22cd49475a84fb084112d1ae7fc171e.mailgun.org:7d79211555e00c458bd6ca5bea33f527@smtp.mailgun.org');

//use handlebars as a template handler
transporter.use('compile', handleBars({
    viewEngine: exphbs({
        defaultLayout: "layout"
    }),
    viewPath: process.cwd() + "/views"
}))

/**
 * Send email using the specified htmltemplate as body of the email
 *
 * @param to
 * @param subject
 * @param htmlTemplate
 * @returns {*}
 */
function sendMail(to, subject, htmlTemplate) {
    if (!to || !subject || !htmlTemplate) {
        //navnirmiteeApi.logger.error('[email] [sendMail] Please provide subject, to and body of email');
        return Q.reject(new Error("Please provide subject, to and body of email"));
    }
    var def = Q.defer();
    var mailOptions = {
        from: 'postmaster@sandboxc22cd49475a84fb084112d1ae7fc171e.mailgun.org', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        //text: htmlToText(htmlText), // plaintext body
        //html: htmlText// html body
        template: htmlTemplate.template,
        context: htmlTemplate.context
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            navnirmiteeApi.logger.error('[email] [sendMail] Error sending mail ', error);
            def.reject(error);
            return;
        }
        navnirmiteeApi.logger.debug('[email] [sendMail] Email sent to ' + to + ':  ' + info.response);
        def.resolve(info);
    });
    return def.promise;
}

//send verification email wit hgiven template to the a particular user.
exports.sendVerificationEmail = function (to, user, verificationLink) {
    return sendMail(to, "Welcome to Live Social", {
        template: "verificationEmail",
        context: {
            userName: user ? user : "",
            verificationLink: verificationLink
        }
    });
}