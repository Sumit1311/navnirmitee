var navCommonUtil = require(process.cwd()+"/lib/navCommonUtil.js"),
    navLogUtil = require(process.cwd()+"/lib/navLogUtil.js"),
    navEmailSender = require(process.cwd() + "/lib/navEmailSender.js");

module.exports = class navEmailVerification extends navEmailSender {
    constructor() {
        super();
    }

    sendVerificationEmail(to, user, verificationLink) {
        var self = this;
        navLogUtil.instance().log.call(self,self.sendVerificationEmail.name, 'Sending verfication email to '+ to + 'with verification link '+verificationLink, "debug");

        return this.sendMail(to, "Welcome to Navnirmitee",{

            template: "verificationEmail",
               context: {
                   userName: user ? user : "",
               verificationLink: verificationLink
               }
        });
    }

    generateCode() {
        return new navCommonUtil().generateUuid();
    }
}
