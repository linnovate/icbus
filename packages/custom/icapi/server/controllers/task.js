'use strict';

var utils = require('./utils');


var mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId;

require('../models/task');
var Task = mongoose.model('Task'),
	User = mongoose.model('User'),
	TaskArchive = mongoose.model('task_archive'),
	mean = require('meanio'),
	_ = require('lodash'),
	elasticsearch = require('./elasticsearch'),
	Update = mongoose.model('Update');

exports.read = function(req, res, next) {
	Task.findById(req.params.id).populate('assign').populate('watchers').exec(function(err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to read task');
		res.status(200);
		return res.json(tasks);
	});
};

exports.all = function(req, res) {
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = elasticsearch.advancedSearch(req.query);
	}

	mean.elasticsearch.search({index:'task','body': query, size: 3000}, function(err,response) {
		if (err)
			res.status(500).send('Failed to found documents');
		else
			res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.create = function(req, res, next) {
	var task = {
		creator: req.user
	};
	task = _.extend(task, req.body);
	new Task(task).save({
		user: req.user,
		discussion: req.body.discussion
	}, function(err, task) {
		if (err) utils.checkAndHandleError(err, res);
		else {
			new Update({
				creator: req.user,
				created: task.created,
				type: 'createTask',
				issueId: task._id,
				issue: 'task'
			}).save({
				user: req.user,
				discussion: req.body.discussion
			}, function(err, update) {});
			res.status(200);
			return res.json(task);
		}
	});
};

exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update task without id');
	}
	Task.findById(req.params.id, function (err, task) {
		if(err) utils.checkAndHandleError(err, res);
		else {
			if (!task) utils.checkAndHandleError(true, res, 'Cannot find task with id: ' + req.params.id);
			else {
				task = _.extend(task, req.body);
				task.updated = new Date();

				task.save({user: req.user, discussion: req.body.discussion}, function(err, task) {
					utils.checkAndHandleError(err, res);
					res.status(200);
					return res.json(task);
				});
			}
		}
	});
	
};

exports.destroy = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot destroy task without id');
	}
	Task.findById(req.params.id, function(err, task) {
		utils.checkAndHandleError(err, res);
		if (!task) utils.checkAndHandleError(true, res, 'Cannot find task with id: ' + req.params.id);
		else {
			task.remove({user: req.user, discussion: req.body.discussion}, function(err, success) {
				utils.checkAndHandleError(err, res, 'Failed to destroy task');
				res.status(200);
				return res.send(success ? 'Task deleted': 'Failed to delete task');
			});
		}
	});
};

exports.tagsList = function(req, res) {
	var query = {
		'query' : { 'query_string' : {'query' : '*'} },
		'facets' : {
			'tags' : { 'terms' : {'field' : 'tags'} }
		}
	};
	mean.elasticsearch.search({index:'task','body': query, size:3000}, function(err,response) {
		res.send(response.facets.tags.terms)
	});
};

exports.getByEntity = function(req, res) {
	var entities = {projects : 'project', users: 'assign', tags: 'tags', _id: '_id'},
		entity = entities[req.params.entity],
		query = {
			query: {
				filtered: {
					filter : {
						terms: {}
					}
				}
			}
	};
	if (!(req.params.id instanceof Array)) req.params.id = [req.params.id];
	query.query.filtered.filter.terms[entity] =  req.params.id;
	mean.elasticsearch.search({index:'task','body': query, size:3000}, function(err,response) {
		res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.getByDiscussion = function(req, res, next) {
	if (req.params.entity !== 'discussions') return next();
	var Query = TaskArchive.distinct('c._id' ,{
		'd': req.params.id
	});
	Query.exec(function(err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to read tasks for discussion ' + req.params.id);
		req.params.id = tasks;
		req.params.entity = '_id';
		next();
	});
};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = TaskArchive.find({
			'c._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.populate('d');
		Query.exec(function(err, tasks) {
			utils.checkAndHandleError(err, res, 'Failed to read history for task ' + req.params.id);

			res.status(200);
			return res.json(tasks);
		});
	} else
		utils.checkAndHandleError(req.params.id + ' is not a mongoose ObjectId', res, 'Failed to read history for task ' + req.params.id);
};

exports.starTask = function(req, res){
	User.findById(req.user._id, function(err, user){
		utils.checkAndHandleError(err, res, 'Failed to load user');
		var set;
		if (!user.profile || !user.profile.starredTasks){
			set= {'profile.starredTasks': [req.params.id] };
		}
		else{
			if (user.profile.starredTasks.indexOf(req.params.id) > -1)
				set= { $pull: { 'profile.starredTasks': req.params.id } };
			else
				set= { $push: { 'profile.starredTasks': req.params.id } };
		}
		user.update(set, function(err, updated) {
			utils.checkAndHandleError(err, res,'Cannot update the starred tasks');
			res.json(updated);
		});
	})
};

exports.getStarredTasks = function(req, res) {
	User.findById(req.user._id, function(err, user) {
		utils.checkAndHandleError(err, res, 'Failed to load user');
		if (!user.profile || !user.profile.starredTasks || user.profile.starredTasks.length == 0) {
			res.json([]);
		} else {
			Task.find({
				'_id': {
					$in: user.profile.starredTasks
				}
			}, function(err, tasks) {
				utils.checkAndHandleError(err, res, 'Failed to read tasks');
				res.status(200);
				return res.json(tasks);
			});
		}
	})
};