var that;

module.exports = class navConfigParser {
    constructor() {
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
