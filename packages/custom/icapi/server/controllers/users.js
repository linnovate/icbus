'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    utils = require('./utils');

/**
 * Find all users
 */
exports.read = function(req, res) {

	var query = {};

	var Query = User.find(query);
	Query.limit(200 || req.query.limit);
	Query.exec(function(err, users) {
		
		utils.checkAndHandleError(err, res, 'Failed to load users');

		res.status(200);
		return res.json(users);
	});
}