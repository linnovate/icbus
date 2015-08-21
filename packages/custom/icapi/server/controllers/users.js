'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	_ = require('lodash'),
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

exports.create = function (req, res, next) {
	var user = {};
	user = _.extend(user, req.body);
	new User(user).save(function (err, task) {
		if (err) {
			utils.checkAndHandleError(err, res);
		} else {
			res.status(200);
			return res.json(task);
		}
	});
};

exports.update = function (req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot update user without id');
	}
	User.findById(req.params.id, function (err, user) {
		if (err) {
			utils.checkAndHandleError(err, res);
		} else {
			if (!user) {
				utils.checkAndHandleError(true, res, 'Cannot find user with id: ' + req.params.id);
			} else {
				user = _.extend(user, req.body);
        user = _.pick(user, ['name', 'username', 'password', 'email', 'profile']);

				user.save(function (err, user) {
					utils.checkAndHandleError(err, res);
					res.status(200);
					return res.json(user);
				});
			}
		}
	});
};

exports.destroy = function (req, res, next) {
  if (!req.params.id) {
    return res.send(404, 'Cannot remove user without id');
  }
  User.findById(req.params.id, function (err, user) {
    utils.checkAndHandleError(err, res);
    if (!user) {
      utils.checkAndHandleError(true, res, 'Cannot find user with id: ' + req.params.id);
    } else {
      user.remove({user: req.user, discussion: req.body.discussion}, function (err, success) {
        utils.checkAndHandleError(err, res, 'Failed to delete user');
        res.status(200);
        return res.send({message: 'User deleted'});
      });
    }
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