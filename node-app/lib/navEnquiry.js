var navEnquiryDAO = require(process.cwd() + "/lib/dao/enquiry/navEnquiryDAO.js"),
    Q = require('q');
module.exports = class navEnquiry {
    constructor(){
    }

    submitEnquiry(name, email, contactNo, body) {
        return new navEnquiryDAO().saveEnquiry(name, email, contactNo, body)
            .then(() => {
                return Q.resolve();
            })
            .catch((error) => {
                return Q.reject(error);
            });
    }
}
