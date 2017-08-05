var navConfigParser = require(process.cwd() + "/lib/navConfigParser.js");
var that;

module.exports = class navToysParser extends navConfigParser {
    constructor(){
        try {
            super("data/toys.json");
            //console.log(this.config);
        } catch(e) {
            super();
            this.config = {
                "brands" :[],
                "skills":[],
                "ageGroups" : [],
                "categories" : []
            }
        }
    }
    static instance() {
            if(that) {
                return that;
            }
            else{
                that= new navToysParser();        
                return that;
            }
    }
}
