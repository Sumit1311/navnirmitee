#!/usr/bin/env node
var navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navProcessTransactions = require(process.cwd() + "/lib/navProcessTransactions.js");


function start() {
    var self = this;
            navLogUtil.log("info", "start", "Sleeping"); 
    setTimeout(function() {
        var pt = new navProcessTransactions();
        navLogUtil.log.call(self,"info", "start", "Starting the pending transaction processing"); 
        pt.processPendingTransactions()
        .done(() => {
            navLogUtil.log.call(self, "info", "start", "Done transaction processing"); 
            start();
        }, (error) => {
            navLogUtil.instance().log.call(self,"start", "FATAL ERROR : "+error, "error")
            process.exit(-1);
        })
    }, 1000);
}


navLogUtil.instance("background-processing");
start();
