var navConfigParser = require(process.cwd() + "/lib/navConfigParser.js");
var that;

module.exports = class navMembershipConfigParser extends navConfigParser {
    constructor(){
        try {
            super("data/membership-plan.json");
            console.log(this.config);
        } catch(e) {
            this.config = {
                "plans" :[]
            }
        }
    }
    static instance() {
            if(that)
                return that;
            else{
                that= new navMembershipConfigParser();        
                return that;
            }
    }
}
