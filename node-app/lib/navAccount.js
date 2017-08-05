var navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navChildDAO = require(process.cwd() + '/lib/dao/child/navChildDAO.js'),
    moment = require('moment'),
    navLogicalException = require("node-exceptions").LogicalException,
    navMembershipParser = require(process.cwd() + "/lib/navMembershipParser.js"),
    navPaymentsDAO = require(process.cwd() + "/lib/dao/payments/navPaymentsDAO.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navUserDAO = require(process.cwd() + '/lib/dao/user/userDAO.js'),
    navUserExistsException = require(process.cwd() + "/lib/exceptions/navUserExistsException.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navPasswordUtil = require(process.cwd() + "/lib/navPasswordUtil.js"),
    Q = require('q');

module.exports = class navAccount {
    constructor(client) {
        if(client) {
            this.client = client;
        } 
    }

    transactionSuccess(transaction) {
        const self = this;
        var userDAO = new navUserDAO(this.client);
        navLogUtil.instance().log.call(self, self.transactionSuccess.name, `Updating success status for ${transaction.user_id} for ${transaction.reason}` , "debug")
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
        navLogUtil.instance().log.call(self, self.rollbackTransaction.name, `Rollbacking transaction for ${transaction.user_id} for ${transaction.reason}` , "debug");
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

    getRechargeDetails(userDetails, type, plan) {
        //Get recharge details
        //Find out the type of recharge need to do
        //Update plan
        //Return array of transactions need to do
        //
        var plans, 
            self = this;

        if(type == "member") {
            plans =  navMembershipParser.instance().getConfig("membership",[]);
        } else {
            plans = navMembershipParser.instance().getConfig("plans",[])[type];
        }

        if(!plans || plans[plan] === undefined) {
            return Q.reject(new navLogicalException());
        }
        var p=plans[plan];
        navLogUtil.instance().log.call(self, self.getRechargeDetails.name, "Plan details : " + p +", type : "+type, "info");

        var transactions = [];
        var transactionId = new navCommonUtil().generateUuid();

        if(type === "member") {
            transactions.push({
                reason : navPaymentsDAO.getReason().REGISTRATION,
                amount : p.amount,
                label : "Registration Fees"
            });
        } else {
            p.deposit = parseInt(p.deposit);
            if(userDetails.deposit < p.deposit) {
                transactions.push({
                    reason : navPaymentsDAO.getReason().DEPOSIT,
                    amount : p.deposit - userDetails.deposit,
                    label : "Deposit"
                });
            }
            transactions.push({
                reason :navPaymentsDAO.getReason().PLANS[type][plan],
                amount : p.amount,
                label : "Recharge "
            });

        }
        return Q.resolve({
            transactions : transactions,
            transactionId : transactionId
        });
    }

    checkIfUserExists(email) {
        return new navUserDAO().getLoginDetails(email)
        .then((user) => {
            if(user.length !== 0) {
                return Q.reject(new navUserExistsException());
            }
            return Q.resolve();
        })
    }

    registerUser(userDetails) {
        return new navUserDAO().insertRegistrationData(userDetails.email, userDetails.contactNo, new navPasswordUtil().encryptPassword(userDetails.password), userDetails.verificationCode);
    }

    getDetailsForCode(code) {
        return (new navUserDAO()).getUserDetailsByCode(code)
        .then(function(userDetails){
            if(userDetails.length === 0) {
                return Q.reject(new navLogicalException("Invalid Code"));
            }
            return Q.resolve(userDetails[0]);
        })
        .catch((error) => {
            return Q.reject(error);
        })

    }

    completeVerification(verificationCode ,additionalDetails) {
        var self = this;
        var userDAO = new navUserDAO(), user; 
        return userDAO.getClient()
            .then(function (_client) {
            userDAO.providedClient = _client;
            return userDAO.startTx();
        })
        .then(function () {
            return userDAO.getUserDetailsByCode(verificationCode);
        })
        //todo : uncomment once email verification done and comment above then
        .then(function (userDetails) {
            if(userDetails.length === 0) {
                return Q.reject(new navLogicalException());
            }
            if(userDetails[0].email_address != additionalDetails.loginEmailId) {
                return Q.reject(new navLogicalException());
            }

            user = userDetails[0];
            if (user.email_verification == verificationCode) {
                return userDAO.clearVerificationCode(user._id)
            } else {
                return Q.reject(new navLogicalException());
            }
        })
        .then(function () {
            var time = new navCommonUtil().getCurrentTime();
            return userDAO.updateUserDetails(user._id, additionalDetails.firstName, additionalDetails.lastName, additionalDetails.address, moment().add(30, "days").valueOf(), time, additionalDetails.pinCode);
        })
        .then(function () {
            return new navChildDAO().insertChildDetails(user._id, additionalDetails.ageGroup, additionalDetails.hobbies, additionalDetails.gender);
        })
        .then(function () {
            return userDAO.commitTx();
        })
        .then(() => {
            return Q.resolve(user);
        })
        .catch(
        function (error) {
            //logg error
            navLogUtil.instance().log.call(self,self.saveAdditionalDetails.name, 'Error while doing registration step 2' + error, "error");
            return userDAO.rollBackTx()
                .then(function () {
                    return Q.reject(error);
                    //res.status(500).send("Internal Server Error");
                })
                .catch(function (err) {
                    //log error
                    navLogUtil.instance().log.call(self,self.saveAdditionalDetails.name, 'Error while doing registration step 2' + err, "error");
                    return Q.reject(err)
                })
        })
        .finally(function () {
            if (userDAO.providedClient) {
                userDAO.providedClient.release();
                userDAO.providedClient = undefined;
            }
        })
    }
    
    getWalletDetails(userId) {
        return new navUserDAO().getUserDetails(userId);
    
    }
    
    getCommunicationDetails(userId) {
        var userDAO = new navUserDAO();
        return userDAO.getAddress(userId)
            .then((userDetails) => {
                return Q.resolve(userDetails[0]);
            })
            .catch((error) => {
                return Q.reject(error);
            });
        
    }

    rentToy(userId, userDetails, toyDetails) {
        var membershipExpiry;
        var self = this;
        if(userDetails.membership_expiry !== null) {
            membershipExpiry = new navCommonUtil().getCurrentTime();
        }
        navLogUtil.instance().log.call(self, self.rentToy.name, "Updating balance of user "+ userDetails.email_address +" to : " + ((userDetails.balance) - (toyDetails.price)) , "info");
        return new navUserDAO(this.client).updatePoints(userId, (userDetails.balance) - (toyDetails.price), membershipExpiry);
    }
}

