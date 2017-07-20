var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navConfigParser = require(process.cwd() + "/lib/navConfigParser.js"),
    navProcessTransactions = require(process.cwd() + "/lib/navProcessTransactions.js");


function start() {
    var self = this;
    navLogUtil.instance().log.call(self,"start", "Sleeping", "info"); 
    setTimeout(function() {
        var pt = new navProcessTransactions();
        navLogUtil.instance().log.call(self,"start", "Starting the pending transaction processing", "info"); 
        pt.processPendingTransactions()
        .done(() => {
            navLogUtil.instance().log.call(self, "start", "Done transaction processing", "info"); 
            start();
        }, (error) => {
            navLogUtil.instance().log.call(self,"start", "FATAL ERROR : "+error, "error")
            process.exit(-1);
        })
    }, navConfigParser.instance().getConfig("BackgroundTransaction").ProcessingInterval || 1000);
}


navLogUtil.instance("background-processing");
start();
