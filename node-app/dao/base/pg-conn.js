var navnirmiteeApi = require(process.cwd() + "/lib/api.js");
var postgresPersistence = require("jive-persistence-postgres")
var persistence = {};


(function () {
    var databaseUrl = "pg://" + navnirmiteeApi.options.db_user + ":" + navnirmiteeApi.options.db_password + "@" + navnirmiteeApi.options.db_host + ":" + navnirmiteeApi.options.db_port + "/" + navnirmiteeApi.options.db_name;
    if (!databaseUrl) {
        navnirmiteeApi.logger.error("Please check database url ", databaseUrl);
        return;
    }

    navnirmiteeApi.logger.debug("Cofiguring database , URL : ", databaseUrl);
    persistence = new postgresPersistence({
        databaseUrl: databaseUrl,
        customLogger: navnirmiteeApi.logger
    });
})();

exports.persistence = persistence
