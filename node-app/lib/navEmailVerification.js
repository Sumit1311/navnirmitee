var navCommonUtil = require(process.cwd()+"/lib/navCommonUtil.js"),
    navEmailSender = require(process.cwd() + "/lib/navEmailSender.js");

module.exports = class navEmailVerification extends navEmailSender {
    constructor() {
        super();
    }

    sendVerificationEmail(to, user, verificationLink) {
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
