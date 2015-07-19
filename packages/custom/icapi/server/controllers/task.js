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
	elasticsearch = require('./elasticsearch');

exports.read = function(req, res, next) {
	Task.findById(req.params.id).populate('assign').exec(function(err, tasks) {
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
		creator : req.user._id
	};
	task = _.extend(task,req.body);
	new Task(task).save({user: req.user}, function(err, task) {
		utils.checkAndHandleError(err,res);
		res.status(200);
		return res.json(task);
	});
};

exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update task without id');
	}
	Task.findById(req.params.id, function (err, task) {
		utils.checkAndHandleError(err, res);
		var data = JSON.parse(req.body.data);
		for (var i in data){
			task[i] = data[i];
		}
		task.updated = new Date();

		task.save({user: req.user}, function(err, task) {
			utils.checkAndHandleError(err, res, 'Failed to update task');
			res.status(200);
			return res.json(task);
		});
	});
	
};

exports.destroy = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot destroy task without id');
	}
	Task.findById(req.params.id, function(err, task) {
		utils.checkAndHandleError(err, res);
		task.remove({user: req.user}, function(err, success) {
			utils.checkAndHandleError(err, res, 'Failed to destroy task');
			res.status(200);
			return res.send(success ? 'Task deleted': 'Failed to delete task');
		});
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
	var entities = {projects : 'project', users: 'creator', tags: 'tags'},
		entity = entities[req.params.entity],
		query = {
			query: {
				filtered: {
					filter : {
						term: {}
					}
				}
			}
	};
	query.query.filtered.filter.term[entity] =  req.params.id;
	mean.elasticsearch.search({index:'task','body': query, size:3000}, function(err,response) {
		res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = TaskArchive.find({
			'd._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
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

exports.getStarredTasks = function(req, res){
	User.findById(req.user._id, function(err, user){
		console.log(user)
		utils.checkAndHandleError(err, res, 'Failed to load user');
		if (!user.profile || !user.profile.starredTasks || user.profile.starredTasks.length == 0){
			res.json([]);
		}
		Task.find({
			'_id': { $in: user.profile.starredTasks}
		}, function(err, tasks){
			utils.checkAndHandleError(err, res, 'Failed to read tasks');
			res.status(200);
			return res.json(tasks);
		});
	})
};