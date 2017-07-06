var Q = require('q');

module.exports = class navSystemUtils {
    executeCommand(command) {
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
    getNoOfFilesMatchPat (pattern, directory) {
        return this.executeCommand('ls ' + directory + pattern + ' | wc -l')
            .then(function(result){
                return Q.resolve(parseInt(result.stdout));
            })
        .catch(function(err){
            return Q.reject(err);
        })
    }
}

