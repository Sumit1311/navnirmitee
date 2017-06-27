/**
 * This class is used to make an AJAX request to the server. Using given parameters
 *
 * @returns {{doRequest: Function}}
 * @constructor
 */
function RequestHandler() {
    return {
        doRequest: function (url, method, body, responseType) {
            var deferred = Q.defer();
            var ajaxOptions = {
                url: url,
                method: method,
                processData: false,
                datatType: responseType,
                success: function (result, status, xhr) {
                    if (responseType) {
                        deferred.resolve(result);
                        return;
                    }
                    var response = JSON.parse(result);
                    deferred.resolve(response);
                    return;

                },
                error: function (xhr, status, error) {
                    deferred.reject(error);
                }
            };

            if (method == "POST") {
                if (typeof body == "object") {
                    ajaxOptions['data'] = JSON.stringify(body);
                    ajaxOptions['contentType'] = "application/json";
                }
                else if (typeof body == "string") {
                    ajaxOptions['data'] = body;
                    ajaxOptions['contentType'] = "application/x-www-form-urlencoded";
                }
            }
            debugger;
            $.ajax(ajaxOptions);
            return deferred.promise;
        }
    }
}

/**
 * Escapes the characters from id of a particular html element.
 *
 * @param myid
 * @returns {*}
 */
function getEscapedId(myid) {
    return myid.replace(/(:|\.|\[|\]|,|@)/g, "\\$1");
}