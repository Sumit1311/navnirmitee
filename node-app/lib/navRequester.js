var request = require('request');
const url = require('url');
var Q = require('q');
var navRequestHandlerException = require(process.cwd() + "/lib/exceptions/navRequestHandlerException.js"),
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    navHTTPException = require(process.cwd() + "/lib/exceptions/navHTTPException.js");



module.exports = class navRequester {
    constructor() {
        this.urlObj = new url.Url();
        this.urlObj.protocol = "http";
        this.urlObj.prot = 80;
        return this;
    }

    setHref(href) {
        this.urlObj.href = href;
        return this;
    } 

    setHostName(host) {
        this.urlObj.hostname = host;
        return this;
    }

    setPort(port) {
        this.urlObj.port = port;
        return this;
    }

    setPathName(path) {
        this.urlObj.pathname = path;
        return this;
    }

    setProtocol(proto) {
        this.urlObj.protocol = proto;
        return this;
    }

    doRequest(options) {
        var self = this;
        var requestOptions = {}, deferred = Q.defer();
        if(!this.urlObj.hostname && !this.urlObj.href) { return Q.reject(new Error()) }
        if(this.urlObj.href) {
            requestOptions.uri = this.urlObj.href;
        } else {
            requestOptions.uri = this.urlObj.format();

        }
        requestOptions.method = options.method || "GET";
        var body = options.body;
        if(requestOptions.method == "GET") {
            if(body) {
                requestOptions.qs = body;
                requestOptions.useQuerystring = true;
            }

        }

        if(requestOptions.method == "POST" || requestOptions.method == "PUT" || requestOptions.method == "PATCH") {
            requestOptions.body = body;
        }
        navLogUtil.instance().log.call(self,self.doRequest.name, 'Requesting with ' + requestOptions, "debug");

        request(requestOptions, function(error, response, body) {
            if(error) {
                navLogUtil.instance().log.call(self,self.doRequest.name, 'Error occured while requesting ' + error, "error");
                return deferred.reject(new navRequestHandlerException(error));
            }
            if(response && (response.statusCode/100 == 4 || response.statusCode/100 == 5 )) {
                navLogUtil.instance().log.call(self,self.doRequest.name, 'Server returned error ' + response, "error");
                return deferred.reject(new navHTTPException(body, response.statusCode));
            }
            return deferred.resolve({
                status : response.statusCode,
                body : body
            });
        });
       return deferred.promise; 
    }


}
