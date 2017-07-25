var navRequester = require(process.cwd() + "/lib/navRequester.js"),
    Q =require('q');


var dataURL = "http://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6?format=JSON&api-key=YOURKEY";

var defaultBody = {
    "format" : "JSON",
    "api-key" : "YOURKEY"
}

module.exports = class naGovtDataFetcher {
    getDetailsByPinCode(pinCode) {
            dataURL += "&filters[pincode]="+pinCode;
            new navRequester().setHref(dataURL).doRequest({
            })
            .then((res) => {
                var body = JSON.parse(res.body);
                if(res.status == 200) {
                   if(body.status === "Error") {
                        return Q.reject(new Error(res.message)); 
                   }
                   var response = {
                   }
                } else {
                    return Q.reject(new Error());
                }
            })
    }
}
