var request = require('request');
const url = require('url');
var Q = require('q');
var navRequestHandlerException = require(processs.cwd() + "/lib/exceptions/navRequestHandlerException.js"),
    navHTTPException = require(processs.cwd() + "/lib/exceptions/navHTTPException.js");



module.exports = class navRequester {
    constructor() {
        this.urlObj = new url.Url();
        this.urlObj.protocol = "http";
        this.urlObj.prot = 80;
        return this;
    }

    setHref(href) {
        this.urlObj.href = href;
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
        var requestOptions = {}, deferred = Q.defer();
        this.urlObj.hostname || this.urlObj.href || (return Q.reject());
        requestOptions.uri = this.urlObj.format();
        var requestOptions.method = options.method || "GET";
        var body = options.body;
        if(method == "GET") {
            if(body) {
                requestOptions.qs = body;
                requestOptions.useQuerystring = true;
            }

        }

        if(method == "POST" || method == "PUT" || method == "PATCH") {
            requestOptions.body = body;
        }
        request(requestOptions, function(error, response, body) {
            if(error) {
                return deferred.reject(new navRequestHandlerException(error));
            }
            if(response && (response.statusCode/100 == 4 || response.statusCode/100 == 5 )) {
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
