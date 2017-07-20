var navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js");

module.exports = class navPayments{
    constructor() {
    }

    updatePayment(paymentId, fields) {
        return new navPaymentsDAO().updatePaymentById(paymentId, fields.paymentStatus, navCommonUtil.getTimeinMillis(fields.retryDate),navCommonUtil.getTimeinMillis(fields.expirationDate));
    }
}
