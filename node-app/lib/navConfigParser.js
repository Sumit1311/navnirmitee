var that, fs = require('fs');
var mustache = require("mustache");
module.exports = class navConfigParser {
    constructor(fileName) {
            if(fileName) {
                try {
                    this.config = JSON.parse(fs.readFileSync(process.cwd() + "/" + fileName));
                    //this.config = mustache.render(this.config, process.env);

                } catch(e){
                    throw e;
                }
            } else {
                try {
                    this.config = JSON.parse(fs.readFileSync(process.cwd() + "/config/navnirmitee.config"));
                    this.config = mustache.render(this.config, process.env);

                } catch(e){
                    this.config = {
                        DatabaseHost: process.env.DB_HOST || "localhost",
                        DatabaseUser: process.env.DB_USER || "admin",
                        DatabasePassword: process.env.DB_PASS || "admin",
                        DatabaseName: process.env.DB_NAME || "navnirmitee",
                        DatabasePort: process.env.DB_PORT || "5433",
                        RedisServerURL: process.env.REDISCLOUD_URL,
                        ListeningPort : process.env.PORT
                    }
                }
            }
    }
   

    getConfig(key, defaultValue) {
        if(this.config[key] == undefined) {
            return defaultValue;
        }
        return this.config[key];
    }

    static instance() {
            if(that)
                return that;
            else{
                that= new navConfigParser();        
                return that;
            }
    }
}
