'use strict';

var mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId;

require('../models/update');
var Update = mongoose.model('Update'),
	UpdateArchive = mongoose.model('update_archive'),
	mean = require('meanio'),
	_ = require('lodash');

exports.create = function(update, cb) {
	new Update(update).save(cb);
};
