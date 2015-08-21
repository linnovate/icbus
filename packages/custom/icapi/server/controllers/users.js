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
exports.all = function(req, res) {
	var query = {};

	var Query = User.find(query);
	Query.limit(200 || req.query.limit);
	Query.exec(function(err, users) {

		utils.checkAndHandleError(err, res, 'Failed to load users');

		res.status(200);
		return res.json(users);
	});
};

exports.read = function(req, res) {
	User.findById(req.params.id, function(err, user) {
		utils.checkAndHandleError(err, res, 'Failed to load user');
		res.status(200);
		return res.json(user);
	});
};

exports.getByEntity = function(req, res) { //It is a temporary function. need to change this function to use elasticsearch!!!!
	res.status(200);
	return res.json([]);
	var query = {
		_id: req.params.id
	};
	var model = (req.params.entity.charAt(0).toUpperCase() + req.params.entity.slice(1)).substring(0, req.params.entity.length - 1);
	var Query = mongoose.model(model).findOne(query);
	Query.exec(function(err, project) {
		if (err || !project) utils.checkAndHandleError(err ? err : !project, res, 'Failed to load project with id: ' + req.params.id);
		else {
			var userIds = project.watchers;
			userIds.push(project.creator);
			User.find({
				_id: {
					$in: userIds
				}
			}).exec(function(err, users) {
				res.status(200);
				return res.json(users);
			});
		}
	});
};