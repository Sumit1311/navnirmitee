var navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navToysHandler = require(process.cwd() + "/lib/navToysHandler.js"),
    navAccount = require(process.cwd() + "/lib/navAccount.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    Q = require('q'), 
    moment = require('moment'), 
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js");

module.exports = class navOrders {
    constructor(client) {
        this.client = client;
    }

    updateOrder(orderId, toyId, userId, updateFields) {
        var self = this;
        var rDAO = new navRentalsDAO(), toyDetail,  orderDetail;
        var updateStatusFlag = true, rollbackFlag = false, returnFlag = false, validationFlag = true, deliveryFlag = false; 
        /*if(!toyId || !userId) {
            promise = rDAO.getOrderDetails(orderId)
                .then((orderDetails) => {
                    if(orderDetails.length === 0) {
                        return Q.reject(new navValidationException()) 
                    } else {
                        //check if this condition needed at all
                        if(orderDetails[0].status !== navRentalsDAO.getStatus().PLACED && orderDetails[0].status !== navRentalsDAO.getStatus().PENDING_GATEWAY) {
                           return Q.reject(new navValidationException()) 
                        }
                        toyId = orderDetails[0].toys_id;
                        userId = orderDetails[0].user_id;
                        return Q.resolve();
                    }
                })
        }*/
        return rDAO.getClient()
            .then((_client) => {
                rDAO.providedClient = _client;
                return rDAO.startTx();
            })
            .then(() => {
                return rDAO.getOrderDetails(orderId)

            })
            .then((orderDetails) => {
                if(orderDetails.length === 0) {
                    return Q.reject(new navValidationException()) 
                } else {
                    //check if this condition needed at all (Cancellation is valid only when order is not delivered or returned)
                    /*if(orderDetails[0].status !== navRentalsDAO.getStatus().PLACED && orderDetails[0].status !== navRentalsDAO.getStatus().PENDING_GATEWAY) {
                        return Q.reject(new navValidationException()) 
                    }*/
                    toyId = orderDetails[0].toys_id;
                    userId = orderDetails[0].user_id;
                    orderDetail = orderDetails[0];
                    return Q.resolve();
                }
            })
            .then(() => {
                //if existing status is same as current
                if(orderDetail.status === updateFields.orderStatus) {
                    //return Q.reject(new navValidationException("New status is same as existing status")); 
                    updateStatusFlag = false;
                }

                if(updateFields.deliveryDate && updateFields.deliveryDate !== "") {
                    deliveryFlag = true;
                }
               

                if(updateFields.orderStatus === navRentalsDAO.getStatus().CANCELLED) {
                    if(orderDetail.status === navRentalsDAO.getStatus().PLACED) {
                        rollbackFlag = true;
                    }
                    else if(orderDetail.status === navRentalsDAO.getStatus().PENDING_GATEWAY) {
                        updateFields.releaseDate = navCommonUtil.getCurrentTime_S(); 
                    }
                    else {
                        validationFlag = false;
                    }                    
                }

                if(updateFields.orderStatus === navRentalsDAO.getStatus().RETURNED) {
                    if(orderDetail.status === navRentalsDAO.getStatus().DELIVERED || 
                        orderDetail.status === navRentalsDAO.getStatus().DUE_RETURN) {
                        returnFlag = true;
                    } else {
                        validationFlag = false;
                    }
                }

                if(!validationFlag) {
                        return Q.reject(new navValidationException()) 
                }
                if(rollbackFlag || returnFlag || deliveryFlag) {
                    return new navToysHandler(rDAO.providedClient).getToyDetail(toyId);
                } else {
                    navLogUtil.instance().log.call(self, self.updateOrder.name, "No pending orders for "+userId+" for toy : "+toyId, "info");
                    return Q.resolve();
                }
            })
            .then((result) => {
                toyDetail = result ? result.toyDetail : {};
                if(rollbackFlag) {
                    navLogUtil.instance().log.call(self, self.updateOrder.name, "Updating balance of user "+userId+" for cancellation of order "+orderId, "info");
                    return new navUserDAO(rDAO.providedClient).updateBalance(userId,  parseInt(toyDetail.price));
                } else {
                    navLogUtil.instance().log.call(self, self.updateOrder.name, "No toy exists for "+toyId, "info");
                    return Q.resolve();
                }

            })
            .then(() => {
                if(rollbackFlag || returnFlag) {
                    return new navToysHandler(rDAO.providedClient).returnFromRent(toyDetail._id);
                } else {
                    return Q.resolve();
                }
            })
            .then(() => {
                if(returnFlag) {
                    navLogUtil.instance().log.call(self, self.updateOrder.name, `Marking order ${orderId} as returned`, "info");
                    updateFields.returnDate = navCommonUtil.getCurrentTime_S();
                } else {
                    updateFields.returnDate = navCommonUtil.getTimeinMillis( updateFields.returnDate);
                }
                if(deliveryFlag) {
                    updateFields.leaseEndDate = moment(updateFields.deliveryDate).add(toyDetail.rent_duration, "days").valueOf()
                } else {
                     updateFields.leaseEndDate = null;
                }
                //Change this implementation
                return rDAO.updateRentalDetails(orderId, navCommonUtil.getTimeinMillis(updateFields.deliveryDate),updateFields.returnDate, navCommonUtil.getTimeinMillis(updateFields.leaseStartDate), updateFields.leaseEndDate, updateFields.shippingAddress, updateFields.orderStatus, updateFields.releaseDate);
            })
            .then(() => {
                return rDAO.commitTx();
            })
            .catch((error) => {
                if(rDAO.providedClient) {
                    return rDAO.rollBackTx()
                        .then(() => {
                            return Q.reject(error);
                        })
                        .catch((err) => {
                            return Q.reject(err);
                        })
                } else {
                    return Q.reject(error);
                }
            })
            .finally(() => {
                if(rDAO.providedClient) {
                    rDAO.providedClient.release();
                    rDAO.providedClient = undefined;
                }
            })

    }

    getOrdersList(offset, limit, sorters) {
        var orderList, statusList, noOfOrders = 0, noOfPages, i = 0;
        return new navRentalsDAO().getOrdersCount()
            .then((_orderCount) => {
                noOfOrders = parseInt(_orderCount[0].count);

                if(noOfOrders % limit !== 0 ) {
                    noOfPages = Math.floor(noOfOrders / limit) + 1;
                } else {
                    noOfPages = Math.floor(noOfOrders / limit) ;
                }
                return new navRentalsDAO().getOrdersFullList(offset, limit, sorters[0].column, sorters[0].type);
            } )
            .then((_rentals) => {
                orderList = _rentals;
                for(i = 0; i < orderList.length; i++) {
                   orderList[i].delivery_date = orderList[i].delivery_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].delivery_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].returned_date = orderList[i].returned_date === null ? "" :new navCommonUtil().getDateString(parseInt(orderList[i].returned_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].lease_start_date =orderList[i].lease_start_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_start_date), "YYYY-MM-DDTHH:mm:ssZ");
                   orderList[i].lease_end_date =orderList[i].lease_end_date === null ? "" : new navCommonUtil().getDateString(parseInt(orderList[i].lease_end_date), "YYYY-MM-DDTHH:mm:ssZ");
                }
                var orderStatus = navRentalsDAO.getStatus();
                statusList = [];
                for(var j in orderStatus) {
                    if(orderStatus.hasOwnProperty(j)) {
                        statusList.push(orderStatus[j]);
                    }
                }
                return Q.resolve({
                    noOfPages : noOfPages,
                    orderList : orderList,
                    statusList : statusList
                });
            })
    }

    getOrders(userId) {
        var transactions = [];
        return new navRentalsDAO().getAllOrders(userId)
        .then((_transactions) => {
            for(var i = 0; i < _transactions.length; i++) {
                transactions.push(navTransactions.createObject(_transactions[i], navTransactions.getType().RENT)); 
            }
            return Q.resolve(transactions);
        })
        .catch((error) => {
            return Q.reject(error);
        })

    }

    getActiveOrders(userId) {
            return new navRentalsDAO(this.client).getOrdersByUserId(userId);
    } 

    placeAnOrder(userDetail, toyDetail) {
        var promises = [], self = this;
        /*
        for(var i = 0; i < transfers.length ; i++) {
            promises.push(new navUserDAO(this.client).transferFromDepositToBalance(userDetail._id, transfers[i].amount));
        }*/
        return Q.allSettled(promises)
            .then((results) => {
                for(var i = 0; i < results.length; i++) {
                    if(results[i].state == 'rejected') {
                        return Q.reject(results[i].reason)
                    }
                }
                return new navRentalsDAO(self.client).saveAnOrder(userDetail._id, toyDetail._id, userDetail.shippingAddress, new Date().getTime(), navRentalsDAO.getStatus().PENDING_GATEWAY, moment().add(navConfigParser.instance().getConfig("ReleaseInterval",30),'minutes').valueOf());

            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.placeAnOrder.name, "Error occured "+ error.stack, "error");
                return Q.reject(error);
            })

    }
    completeOrder(orderId, status) {
        const self = this;
        if(status === "success") {
            return self.markSuccess(orderId); 
        } else if(status === "failure") {
            return new navRentalsDAO(this.client).updateStatus(orderId, navRentalsDAO.getStatus().FAILED, null);
        }
    }

    markSuccess(orderId) {
        const self = this;

        var order, walletDetail, toyDetail;

        return new navRentalsDAO(self.client).getOrderDetails(orderId)
            .then((orders) => {
                if(orders.length !== 0){
                    order = orders[0];
                    if(order.release_date > navCommonUtil.getCurrentTime_S() ) {
                        return new navRentalsDAO(self.client).updateStatus(orderId, navRentalsDAO.getStatus().PLACED, navCommonUtil.getCurrentTime_S());
                    } else {
                        return new navRentalsDAO(self.client).updateStatus(orderId, navRentalsDAO.getStatus().FAILED, navCommonUtil.getCurrentTime_S());
                    }

                }
            })
            .then(() => {
                return new navToysHandler(self.client).getToyDetail(order.toys_id);
            })
            .then((result) => {
                toyDetail = result.toyDetail;
                /*if(toyDetails.price > userDetails.balance) {
                    return Q.reject(new navNoBalanceException());
                }*/
                /*if(toyDetail.stock === 0) {
                    return Q.reject(new navNoStockException());
                }*/
                return new navToysHandler(self.client).getOnRent(order.toys_id);
            })
            .then(() => {
                return new navAccount(self.client).getWalletDetails(order.user_id);
            })
            .then((walletDetails) => {
                if(walletDetails.length === 0) {
                    return Q.reject(new Error("Wallet details not found"));
                }
                walletDetail = walletDetails[0];
                return new navAccount(self.client).rentToy(order.user_id, walletDetail, toyDetail);
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.markSuccess.name, "Error " + error.stack, "error");
                return Q.reject(error);
            })
    }


} 

/*function checkValidityOfUpdate(newStatus, oldStatus) {
    if(newStatus === oldStatus) {
        //no need to do anything
    }
    if(newStatus === navRentalsDAO.getStatus().CANCELLED) {
        if(oldStatus === navRentalsDAO.getStatus().PLACED) {
            //rollback the toys stock and balance 
        }
            
        else if(oldStatus === navRentalsDAO.getStatus().PENDING_GATEWAY) {
            //no rollback only status update
        }

        else {
            //error validation
        }
    }

    if(newStatus === navRentalsDAO.getStatus().RETURNED) {
        //update return date and update toy stock
    }

}*/

/* Order Status State Diagram : 
 *        -----> F        -----------------  
 *      |                |                 |
 *      PG ----> P ----> D ----> DR -----> R
 *      |        |
 *        -----> C
 */
