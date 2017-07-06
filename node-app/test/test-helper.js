var spawn=require('child_process').spawn;
var app;

exports.runApp=function(){
    app = spawn("npm",["start"]);
}

exports.stopApp=function(){
    app.kill();
}
