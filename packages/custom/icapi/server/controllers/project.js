'use strict';
require('../models/project')
var utils = require('./utils'),
	mongoose = require('mongoose'),
	Project = mongoose.model('Project'),
	rooms = require('../../../hi/server/controllers/rooms'),
	_ = require('lodash'),
	elasticsearch = require('./elasticsearch'),
	mean = require('meanio');

exports.read = function(req, res, next) {
	Project.findById(req.params.id,function(err, project) {
		utils.checkAndHandleError(err, res, 'Failed to load project');
		res.status(200);
		return res.json(project);
	});
};

exports.all = function(req, res) {
	var query = {query:{ match_all : { }	}};
	if (!(_.isEmpty(req.query))) {
		query = elasticsearch.advancedSearch(req.query);
	}

	mean.elasticsearch.search({index:'project',body: query, size:3000}, function(err,response) {
		if (err)
			res.status(500).send('Failed to found project');
		else
			res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.create = function(req, res, next) {
	var project = {
		creator : req.user._id
	};
	project = _.extend(project,req.body);
	rooms.createForProject(req, res, project)
		.then(function (roomId) {
			project.room = roomId;
		}, function (error) {
			console.log('cannot create a room in lets-chat '+ error);
		})
		.done(function(){
			new Project(project).save({user: req.user}, function(err, response) {
				utils.checkAndHandleError(err,res);
				res.json(response);
			});
		});
};


exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update project without id');
	}
	Project.findById(req.params.id, function (err, project) {
		utils.checkAndHandleError(err, res);

		project.updated = new Date();
		for (var i in req.body){
			project[i] = req.body[i];
		}
		project.save({user: req.user}, function (err, project) {
			utils.checkAndHandleError(err, res, 'Failed to update project');
			if (req.body.watchers && !(_.isEqual(req.body.watchers.sort(), project.watchers.sort()))) {//if we have some changes in watchers field
				rooms.updateParticipants(project.room, project.title, req.body.watchers)
					.then(function () {
						return res.status(200).json(project);
					},
					function (error) {
						utils.checkAndHandleError(error, res, 'Failed to update room');
					});
			}
			return res.status(200).json(project);
		});

	});
};

exports.destroy = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot destroy project without id');
	}

	Project.findById(req.params.id, function(err, project) {
		utils.checkAndHandleError(err, res);
		if (!project) utils.checkAndHandleError('Cannot find project with id: ' + req.params.id, res, 'Cannot find project with id: ' + req.params.id);
		else
			project.remove({
				user: req.user
			}, function(err, success) {
				utils.checkAndHandleError(err, res, 'Failed to destroy project');

				res.status(200);
				return res.send(success ? 'Project deleted' : 'Failed to delete project');
			});
	});
};
