var navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js");

module.exports = class navAccount {
    constructor(client) {
        if(client) {
            this.client = client;
        } 
    }

    transactionSuccess(transaction) {
        const self = this;
        var userDAO = new navUserDAO(this.client);
        navLogUtil.instance().log.call(self, self.getOrders.name, `Updating success status for ${transaction.user_id} for ${transaction.reason}` , "debug")
        switch(transaction.reason) {
            case navPaymentsDAO.getReason().DEPOSIT :
                return userDAO.updateDeposit(transaction.user_id,transaction.amount_payable);
            case navPaymentsDAO.getReason().REGISTRATION:
                return userDAO.updateMembershipExpiry(transaction.user_id, null);
            default :   
                return userDAO.updateBalance(transaction.user_id,transaction.amount_payable);
        }
    }
    rollbackTransaction(transaction) {
        var userDAO = new navUserDAO(this.client);
        const self = this;
        navLogUtil.instance().log.call(self, self.getOrders.name, `Rollbacking transaction for ${transaction.user_id} for ${transaction.reason}` , "debug");
        switch(transaction.reason) {
            case navPaymentsDAO.getReason().DEPOSIT :
                return userDAO.updateDeposit(transaction.user_id,transaction.amount_payable, true);
            case navPaymentsDAO.getReason().REGISTRATION:
                //TODO : Add a proper logic here
                return userDAO.updateMembershipExpiry(transaction.user_id, new Date().getTime());
            default :   
                return userDAO.updateBalance(transaction.user_id,transaction.amount_payabe, true);
        }
    }
}
