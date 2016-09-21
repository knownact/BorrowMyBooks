var fs = require('fs');
var http = require('http');
var util = require('util');
var validator = require('validator');
var should = require('chai').should();

var config = require('../../config');

var mongoose = require('mongoose');

var seed = require('../../db/seedDb');
var clear = require('../../db/clearDb');

//models
var interest = require('../../models/interest');

describe('#Interest Schema', function() {
    // tests here
    it('should be able to generate a valid UUID', function() {
        var testStr = interest.schema.methods.generateUUID();
        validator.isUUID(testStr).should.be.true;
    });
});