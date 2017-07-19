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
                        ListeningPort : process.env.PORT,
                        HostName : process.env.HOST_NAME || "localhost",
                        PaymentGateway : {
                            Domain : "https://pguat.paytm.com",
                            MerchantID : "WorldP64425807474247",
                            MerchantKey : "kbzk1DSbJiV_O3p5",
                            Website : "worldpressplg",
                            ChannelID : "WEB",
                            IndustryType : "Retail",
                            CallbackURLPath : "/response", 
                            TransactionURLPath : "/oltp-web/processTransaction",
                            StatusAPIPath : "/oltp/HANDLER_INTERNAL/getTxnStatus",
                            RetryInterval : 8, //hours
                            ExpirationInterval : 72 //hours
                        },
                        BackgroundTransaction : {
                            ProcessingInterval : 1000 // ms
                        }
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
