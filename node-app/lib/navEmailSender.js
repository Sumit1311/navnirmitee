var Q = require('q'),
    htmlToText = require('html-to-text'),
    navnirmiteeApi = require("./api.js"),
    nodemailer = require('nodemailer'),
    navSendEmailException = require(process.cwd() + "/lib/exceptions/navSendEmailException.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    exphbs = require('express-handlebars'),
    handleBars = require('nodemailer-express-handlebars');


module.exports = class navEmailSender {
    constructor(smtpServerURL) {
        this.transporter = nodemailer.createTransport('smtps://postmaster%40sandboxc22cd49475a84fb084112d1ae7fc171e.mailgun.org:7d79211555e00c458bd6ca5bea33f527@smtp.mailgun.org');

        this.transporter.use('compile', handleBars({
            viewEngine: exphbs({
                layout:"nav_email_layout",
                extname : ".hbs"
            }),
                viewPath: process.cwd() + "/views",
            extName : ".hbs"
        }))
   }    

 

//use handlebars as a template handler

/**
 * Send email using the specified htmltemplate as body of the email
 *
 * @param to
 * @param subject
 * @param htmlTemplate
 * @returns {*}
 */
    sendMail(to, subject, htmlTemplate) {

        var self = this;
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
        self.transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                navLogUtil.instance().log.call(self,'sendMail','Error sending mail ' + error, "error");
                return def.reject(new navSendEmailException(error));
            }
            navLogUtil.instance().log.call(self,'sendMail','Error sent to '+ to + ' : ' + info.response, "debug");
            def.resolve(info);
        });
        return def.promise;
    }
}
