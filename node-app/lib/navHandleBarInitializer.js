var exphbs = require('express-handlebars');
var hbshelpers = require('handlebars-helpers');
var path = require('path');
var that;

module.exports = class navHandleBarInitializer {
    constructor() {
        this.hbs = exphbs.create({
                extname : '.hbs',
                layout : 'nav_bar_layout'
            });
    }
    static instance() {
        if(that) {
            return that;
        }
        else {
            that = new navHandleBarInitializer();
    
            return that;
        }
    }

    init(){
         hbshelpers({
            handlebars: this.hbs.handlebars
         });
    }
    
    register(app) {
            app.set('views', path.join(process.cwd() , 'views'));
            app.engine('hbs', this.hbs.engine);
            app.set('view engine', 'hbs');
    }

    
}
