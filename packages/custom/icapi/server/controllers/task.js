'use strict';

var utils = require('./utils');


var mongoose = require('mongoose');

require('../models/task');
var Task = mongoose.model('Tasks'),
	mean = require('meanio'),
	_ = require('lodash');

exports.read = function(req, res, next) {
	Task.findById(req.params.id).populate('assign').exec(function(err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to read task');
		res.status(200);
		return res.json(tasks);
	});
};

exports.query = function(req, res) {
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = advancedSearch(req.query);
	}

	mean.elasticsearch.search({index:'task','body': query}, function(err,response) {
		if (err)
			res.status(500).send('Failed to found documents');
		else
			res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

function advancedSearch(query) {
	var queries = [], jsonQuery;
	for (var i in query){
		var isArray = query[i].indexOf(',') > -1;
		if (isArray){
			var terms = query[i].split(',');
			jsonQuery = {terms: {minimum_should_match: terms.length}};
			jsonQuery.terms[i] = terms;
			queries.push(jsonQuery);
		}
		else{
			jsonQuery = {term: {}};
			jsonQuery.term[i] = query[i];
			queries.push(jsonQuery);
		}
	}
	return {
		query : {
			filtered: {
				query : {
					bool : {must: queries}
				}
			}
		}
	}
}

exports.create = function(req, res, next) {
	//this is just sample - validation coming soon
	//We deal with each field indavidually unless it is in a schemaless object
	if (req.params.id) {
		return res.send(401, 'Cannot create task with predefined id');
	}

	var task = {
		created: new Date(),
		updated: new Date(),
		status: req.body.data.status || 'Received'
	};

	var data = _.extend(task, JSON.parse(req.body.data));
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

exports.readHistory = function(req, res, next) {
	var Query = TaskArchive.find({'d._id': new ObjectId(req.params.id)});
	Query.populate('u');
	Query.exec(function(err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to read history for task ' + req.params.id);

		res.status(200);
		return res.json(tasks);
	});
};