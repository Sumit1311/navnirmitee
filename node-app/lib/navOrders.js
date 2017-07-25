var navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navValidationException = require(process.cwd() + "/lib/exceptions/navValidationException.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    Q = require('q'), 
    navUserDAO = require(process.cwd() + "/lib/dao/user/userDAO.js");

module.exports = class navOrders {
    constructor() {
    }

    updateOrder(orderId, toyId, userId, updateFields) {
        var rDAO = new navRentalsDAO(), toyDetail, userDetail, promise = Q.resolve();
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
                
                return new navToysDAO(rDAO.providedClient).getToyDetailById(toyId);
            } else {
                return Q.resolve();
            }
            })
            .then((_toyDetails) => {
                    if(_toyDetails && _toyDetails.length !== 0 && updateFields.orderStatus == navRentalsDAO.getStatus().CANCELLED) {
                        toyDetail = _toyDetails[0];
                        return new navUserDAO(rDAO.providedClient).updateBalance(userId,  parseInt(toyDetail.price));
                    } else {
                        return Q.resolve();
                    }

            })
            .then(() => {
                if(toyDetail) {
                    return new navToysDAO(rDAO.providedClient).updateToyStock(toyId, 1, true);
                } else {
                    return Q.resolve();
                }
            })
            .then(() => {
                if(updateFields.orderStatus == navRentalsDAO.getStatus().RETURNED) {
                    updateFields.returnDate = navCommonUtil.getCurrentTime_S();
                } else {
                    updateFields.returnDate = navCommonUtil.getTimeinMillis( updateFields.returnDate);
                }
                //if(updateFields.deliveryDate) {
                return rDAO.updateRentalDetails(updateFields.orderId, navCommonUtil.getTimeinMillis(updateFields.deliveryDate),updateFields.returnDate, navCommonUtil.getTimeinMillis(updateFields.leaseStartDate), navCommonUtil.getTimeinMillis(updateFields.leaseEndDate), updateFields.shippingAddress, updateFields.orderStatus);
                /*} else {
                   return rDAO.updateStatus(orderId, updateFields.orderStatus); 
                }*/
            })
            .then(() => {
                return rDAO.commitTx();
            })
            .catch((error) => {
                return rDAO.rollbackTx()
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


} 
