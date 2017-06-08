var expect = require('chai').expect;
var request = require('request');
var helper = require(process.cwd()+'/test/test-helper.js');


describe("Basic Server Test",() => {
    beforeEach(() => {
      helper.runApp();  
    });
    afterEach(() => {
        helper.stopApp();
    });
    it("returns status 200",(done) => {
        request("http://localhost:3000/ping",(err,response,body) => {
            expect(response.statusCode).to.equal(200);
            expect(body).to.equal("pong");
            done();
        });
    });
});
