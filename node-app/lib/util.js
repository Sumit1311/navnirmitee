var uuid = require('node-uuid'),
    Q = require('q'),
    navnirmiteeApi = require("./api.js"),
    bcrypt = require('bcrypt-nodejs');

//generates uuid
exports.uuid = function () {
    return uuid.v4();
};

//creates a hash for password using bcrypt
exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password);
};

//compare the password with provided hash whether it matches or not
exports.comparePassword = function (password, hash) {
    return bcrypt.compareSync(password, hash);
};

//generate a unique verfication code for email
exports.generateEmailVerificationCode = function () {
    return exports.uuid();
}

/**
 * Takes an array and convert it to a particular keys value hash table.
 * Used for fast lookup inside an array
 *
 * @param array
 * @param key
 * @returns {{}}
 */
exports.convertArrayToJSON = function (array, key) {
    var resJson = {};
    for (var i in array) {
        if (typeof array[i] == "string") {
            resJson[array[i]] = array[i];
        } else if (typeof array[i] == "object") {
            resJson[array[i][key]] = array[i]
        }
    }
    return resJson;
};

/**
 *
 * General purpose method to log errors inside application.
 *
 * @param fileName
 * @param functionName
 * @param error
 */
exports.logError = function (fileName, functionName, error) {
    if (error instanceof Error) {
        navnirmiteeApi.logger.error('[' + fileName + '] [' + functionName + '] Error occured ', error.stack);
    } else {
        navnirmiteeApi.logger.error('[' + fileName + '] [' + functionName + '] Error occured ', error);
    }
    return;
};

/**
 * Ensure authentication of user.
 * This is a middle ware for common routes which are protected from anonymous user
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // Redirect if not authenticated
    res.redirect('/login');
};

/**
 * Ensures that the user is deserialized properly to the session.
 *
 * @param req
 * @param res
 * @param next
 */
exports.isSessionAvailable = function (req, res, next) {
    var userDetails = req.user;
    if (userDetails && userDetails._id) {
        next();
    } else {
        res.redirect("/login");
    }
};

/**
 * Verifies whether the user is admin
 *
 * @param req
 * @param res
 * @param next
 */
exports.isAuthorized = function (req, res, next) {
    var userDetails = req.user, authorized = false;
    if (userDetails.user_type) {
        var cons = navnirmiteeApi.constants.userRoleMapping;
        for (var key in cons) {
            if (cons[key] == 0 || cons[key] == 1) {
                authorized = true;
                break;
            }
        }
        if (authorized) {
            next();
        } else {
            res.status(401).send(JSON.stringify({
                "code": "NotAuthorized"
            }));
        }
    } else {
        res.redirect("/login");
    }
};

exports.refactorDatabaseTables = function (tableName, rows) {
    var columns = {};
    var refactoredRows = [];
    switch (tableName) {
        case "society_master":
            columns = {
                _id: "societyId",
                society_name: "societyName",
                society_registered_number: "societyRegNumber",
                society_address_line1: "societyAddressLine1",
                society_address_line2: "societyAddressLine2",
                society_city: "societyCity",
                society_pincode: "societyPinCode",
                society_state: "societyState",
                society_total_wings: "societyTotalWings"
            };
            break;

        case "society_wings":
            columns = {
                _id: "wingId",
                "society_wing_name": "wingName",
                "total_flats": "totalFlats",
                "modified_by": "modifiedBy",
                "modified_date": "modifiedDate",
                "society_wings_total_floors": "totalFloors",
                "society_master_id": "societyId"
            };
            break;
        case "amenities_master":
            columns = {
                "_id": "amenitiesId",
                "name": "amenitiesName"
            };
            break;
        case "society_amenities":
            columns = {
                "_id": "societyAmenitiesId",
                "description": "amenitiesDescription",
                "timings": "amenitiesTimings",
                "society_master_id": "societyId",
                "amenities_master_id": "amenitiesId",
                "society_employees_id": "employeeId"
            };
            break;
        case "society_rules":
            columns = {
                "_id": "ruleId",
                "rule_name": "ruleName",
                "rule_description": "ruleDescription",
                "society_master_id": "societyId",
                "rules_category_id": "ruleCategoryId"
            };
            break;
        case "rules_category":
            columns = {
                "_id": "ruleCategoryId",
                "label": "categoryLabel"
            }
            break;
        case "todo_list":
            columns = {
                "_id": "toDoId",
                "detail": "toDoDetail",
                "created_date": "createdDate",
                "is_done": "isDone"
            };
            break;
    }

    for (var r in rows) {
        refactoredRows[r] = {};
        for (var key in rows[r]) {
            if (rows[r].hasOwnProperty(key)) {
                if (columns[key]) {
                    refactoredRows[r][columns[key]] = rows[r][key];
                } else {
                    refactoredRows[r][key] = rows[r][key];
                }
            }
        }
    }
    return refactoredRows;
}

exports.executeSystemCommand = function(command) {
    const exec = require('child_process').exec;
    
    var deferred = Q.defer();
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            deferred.reject(error);
        }
        deferred.resolve({
            stdout : stdout,
            stderr : stderr
        });
    });
    return deferred.promise;
}

exports.getNoOfFilesMatchPat = function(pattern, directory)
{
    return exports.executeSystemCommand('ls ' + directory + pattern + ' | wc -l')
        .then(function(result){
            return Q.resolve(parseInt(result.stdout));
        })
        .catch(function(err){
            return Q.reject(err);
        })
}
