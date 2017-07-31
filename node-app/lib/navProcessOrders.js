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
            .then((result) => {
                navLogUtil.instance().log.call(self, self.processOrders.name, "Marked Orders "+result +" for return ", "info");
                return Q.resolve();
            })
            .catch((error) => {
                navLogUtil.instance().log.call(self, self.processOrders.name,"Error : " + error, "error");
                return Q.resolve();
            })
    }
}
