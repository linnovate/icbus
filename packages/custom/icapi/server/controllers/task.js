'use strict';

var utils = require('./utils');


var mongoose = require('mongoose');

require('../models/task');
var Task = mongoose.model('Tasks'),
	mean = require('meanio'),
	_ = require('lodash');

exports.read = function(req, res, next) {
	var query = {};
	if (req.params.id) {
		query._id = req.params.id;
	}
	if (req.query)
		query = req.query;

	var Query = Task.find(query);
	Query.populate('creator');
	Query.limit(200 || req.query.limit);
	Query.exec(function(err, tasks) {
		
		utils.checkAndHandleError(err, res, 'Failed to read task');

		res.status(200);
		return res.json(tasks);
	});
};

exports.query = function(req, res) {
	if (!(_.isEmpty(req.query))) {
		var queries = [];
		if (req.query.tags){
			var tags = req.query.tags.split(',');
			queries.push({
				"terms" : {
					"tags" : tags,
					"minimum_should_match" : tags.length
				}
			});
		}
		if (req.query.status)
			queries.push({term: {status: req.query.status}});

		var query = {
			query : {
				filtered: {
					query : {
						bool : {must: queries}
					}
				}
			}
		}
	}

	mean.elasticsearch.search({index:'task','body': query}, function(err,response) {
		if (err)
			res.status(500).send('Failed to found documents');
		else
			res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.create = function(req, res, next) {
	//this is just sample - validation coming soon
	//We deal with each field indavidually unless it is in a schemaless object
	if (req.params.id) {
		return res.send(401, 'Cannot create task with predefined id');
	}

	var task = {
		created: new Date(),
		updated: new Date(),
		status: req.body.status || 'Received'
	};

	if (req.body.tags){
		req.body.tags = JSON.parse(req.body.tags);
	}
	var data = _.extend(task, req.body);

	new Task(data).save({user: req.user}, function(err, task) {
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

		task.updated = new Date();

		if (req.body.title)  task.title = req.body.title;
		if (req.body.parent) task.parent = req.body.parent;
		if (req.body.tags) task.tags = req.body.tags;
		if (req.body.due) task.due = req.body.due;

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
	mean.elasticsearch.search({index:'task','body': query}, function(err,response) {
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
	mean.elasticsearch.search({index:'task','body': query}, function(err,response) {
		res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};
