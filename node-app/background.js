var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navProcessTransactions = require(process.cwd() + "/lib/navProcessTransactions.js"),
    navProcessOrders = require(process.cwd() + "/lib/navProcessOrders.js");


function startTransactionsProcessing() {
    var self = this;
    navLogUtil.instance().log.call(self,"startTransactionsProcessing", "Sleeping", "info"); 
    setTimeout(function() {
        var pt = new navProcessTransactions();
        navLogUtil.instance().log.call(self,"startTransactionsProcessing", "Starting the pending transaction processing", "info"); 
        pt.processPendingTransactions()
        .done(() => {
            navLogUtil.instance().log.call(self, "startTransactionsProcessing", "Done transaction processing", "info"); 
            startTransactionsProcessing();
        }, (error) => {
            navLogUtil.instance().log.call(self,"startTransactionsProcessing", "FATAL ERROR : "+error, "error")
            process.exit(-1);
        })
    }, navConfigParser.instance().getConfig("BackgroundProcessing").TransactionInterval || 1000);
}
function startOrdersProcessing() {
    var self = this;
    navLogUtil.instance().log.call(self,"startOrdersProcessing", "Sleeping", "info"); 
    setTimeout(function() {
        var pt = new navProcessOrders();
        navLogUtil.instance().log.call(self,"startOrdersProcessing", "Starting the orders processing", "info"); 
        pt.processOrders()
        .done(() => {
            navLogUtil.instance().log.call(self, "startOrdersProcessing", "Done orders processing", "info"); 
            startOrdersProcessing();
        }, (error) => {
            navLogUtil.instance().log.call(self,"startOrdersProcessing", "FATAL ERROR : "+error, "error")
            process.exit(-1);
        })
    }, navConfigParser.instance().getConfig("BackgroundProcessing").OrderInterval || 1000);
}


navLogUtil.instance("background-processing");
startTransactionsProcessing();
startOrdersProcessing();
