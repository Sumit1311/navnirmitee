/**
 * Created by iMitesh on 18/05/16.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt.js');

//User Schema
var userSchema = mongoose.Schema({
    userName : {
        type: String,
        index : true
    },
    password : {
        type:String
    },
    email : {
        type : String
    },
    name : {
        type : String
    }
});

var User = module.exports = mongoose.model('User', userSchema);

model.exports.createUser = function(newUser, callback){
    bcrypt.getSalt(10, function(err, salt){
        bcrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getUserByUserName = function(userName, callback){
    var query = {userName : userName};
    User.findOne(query, callback);

};

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch){
        if(err){
            throw err;
        }
        callback(null, isMatch);
    })
}