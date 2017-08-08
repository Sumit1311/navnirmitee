var navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navTransactions = require(process.cwd() + "/lib/navTransactions.js"),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navToysHandler = require(process.cwd() + "/lib/navToysHandler.js"),
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
        var rDAO = new navRentalsDAO(), toyDetail,  promise = Q.resolve();
        if(!toyId || !userId) {
            promise = rDAO.getOrderDetails(orderId)
                .then((orderDetails) => {
                    if(orderDetails.length === 0) {
                        return Q.reject(new navValidationException()) 
                    } else {
                        if(orderDetails[0].status != navRentalsDAO.getStatus().PLACED) {
                           return Q.reject(new navValidationException()) 
                        }
                        toyId = orderDetails[0].toys_id;
                        userId = orderDetails[0].user_id;
                        return Q.resolve();
                    }
                })
        }
        return promise
            .then(() => {
                return rDAO.getClient()
            })
            .then((_client) => {
                rDAO.providedClient = _client;
                return rDAO.startTx();
            })
            .then(() => {
                if(updateFields.orderStatus == navRentalsDAO.getStatus().CANCELLED || updateFields.orderStatus == navRentalsDAO.getStatus().RETURNED) {

                    return new navToysHandler(rDAO.providedClient).getToyDetail(toyId);
                } else {
                    navLogUtil.instance().log.call(self, self.updateOrder.name, "No pending orders for "+userId+" for toy : "+toyId, "info");
                    return Q.resolve();
                }
            })
            .then((result) => {
                    if(result && result.toyDetail && updateFields.orderStatus == navRentalsDAO.getStatus().CANCELLED) {
                        toyDetail = result.toyDetail;
                        navLogUtil.instance().log.call(self, self.updateOrder.name, "Updating balance of user "+userId+" for cancellation of order "+orderId, "info");
                        return new navUserDAO(rDAO.providedClient).updateBalance(userId,  parseInt(toyDetail.price));
                    } else {
                        navLogUtil.instance().log.call(self, self.updateOrder.name, "No toy exists for "+toyId, "info");
                        return Q.resolve();
                    }

            })
            .then(() => {
                if(toyDetail) {
                    return new navToysHandler(rDAO.providedClient).returnFromRent(toyDetail._id);
                } else {
                    return Q.resolve();
                }
            })
            .then(() => {
                if(updateFields.orderStatus == navRentalsDAO.getStatus().RETURNED) {

                    navLogUtil.instance().log.call(self, self.updateOrder.name, `Marking order ${orderId} as returned`, "info");
                    updateFields.returnDate = navCommonUtil.getCurrentTime_S();
                } else {
                    updateFields.returnDate = navCommonUtil.getTimeinMillis( updateFields.returnDate);
                }
                //if(updateFields.deliveryDate) {
                return rDAO.updateRentalDetails(orderId, navCommonUtil.getTimeinMillis(updateFields.deliveryDate),updateFields.returnDate, navCommonUtil.getTimeinMillis(updateFields.leaseStartDate), navCommonUtil.getTimeinMillis(updateFields.leaseEndDate), updateFields.shippingAddress, updateFields.orderStatus);
                /*} else {
                   return rDAO.updateStatus(orderId, updateFields.orderStatus); 
                }*/
            })
            .then(() => {
                return rDAO.commitTx();
            })
            .catch((error) => {
                return rDAO.rollBackTx()
                    .then(() => {
                        return Q.reject(error);
                    })
                    .catch((err) => {
                        return Q.reject(err);
                    })
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
                return new navRentalsDAO(self.client).saveAnOrder(userDetail._id, toyDetail._id, userDetail.shippingAddress, new Date().getTime(), moment().add(toyDetail.rent_duration,'days').valueOf(), navRentalsDAO.getStatus().PENDING_GATEWAY, moment().add(navConfigParser.instance().getConfig("ReleaseInterval",30),'minutes').valueOf());

            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.placeAnOrder.name, "Error occured "+ error.stack, "error");
                return Q.reject(error);
            })

    }
    completeOrder(orderId, status) {
        if(status === "success") {
            return this.markSuccess(orderId); 
        } else if(status === "failure") {
            return new navRentalsDAO(this.client).updateStatus(orderId, navRentalsDAO.getStatus().FAILED, null);
        }
    }

    markSuccess(orderId) {
        const self = this;
        return new navRentalsDAO(this.client).getOrderDetails(orderId)
            .then((orders) => {
                if(orders.length !== 0){
                    var order = orders[0];
                    if(order.release_date > navCommonUtil.getCurrentTime_S() ) {
                        return new navRentalsDAO(self.client).updateStatus(orderId, navRentalsDAO.getStatus().PLACED, null);
                    } else {
                        return new navRentalsDAO(self.client).updateStatus(orderId, navRentalsDAO.getStatus().FAILED, null);
                    }

                }
            })
    }
} 
