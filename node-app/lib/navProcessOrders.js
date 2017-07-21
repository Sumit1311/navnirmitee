var navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navPGRouter = require(process.cwd() + "/lib/navPGRouter.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');

module.exports = class navProcessTransactions {
    constructor() {
    }

    processOrders() {
        var self = this; 
        return new navRentalsDAO().markOrdersForReturn()
            .catch((error) => {
                navLogUtil.instance().log.call(self, "processOrders","Error : " + error, "error");
                return Q.resolve();
            })
    }
}
