'use strict';
require('../models/project')
var utils = require('./utils'),
	mongoose = require('mongoose'),
	Project = mongoose.model('Project'),
	rooms = require('../../../hi/server/controllers/rooms'),
	_ = require('lodash');



exports.read = function(req, res, next) {

	var query = {};

	if (req.params.id) {
		query._id = req.params.id;
	}
	var Query = Project.find(query);
	Query.limit(200 || req.query.limit);
	Query.exec(function(err, projects) {
		
		utils.checkAndHandleError(err, res, 'Failed to create project');

		res.status(200);
		return res.json(projects);
	});
}

exports.create = function(req, res, next) {
	var project = {
		created: new Date(),
		updated: new Date(),
		creator : req.user._id
	};
	project = _.extend(project,req.body);

	rooms.createForProject(project)
		.then(function (roomId) {
			project.room = roomId;
			new Project(project).save({user: req.user}, function(err, response) {
				utils.checkAndHandleError(err,res);
				res.json(response);
			});
		}, function (error) {
			utils.checkAndHandleError(error,res);
		});
};

exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update project without id');
	}
	Project.findById(req.params.id, function (err, project) {
		utils.checkAndHandleError(err, res);

		project.updated = new Date();
		if (req.body.title) project.title = req.body.title;
		if (req.body.parent)  project.parent = req.body.parent;
		if (req.body.color)  project.color = req.body.color;

		project.save({user: req.user}, function(err, project) {
			utils.checkAndHandleError(err, res, 'Failed to update project');

			res.status(200);
			return res.json(project);
		});

	});
	
};

exports.destroy = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot destroy project without id');
	}

	Project.findById(req.params.id, function(err, project) {
		utils.checkAndHandleError(err, res);
		project.remove({user: req.user}, function(err, success) {
			utils.checkAndHandleError(err, res, 'Failed to destroy project');

			res.status(200);
			return res.send(success ? 'Project deleted' : 'Failed to delete project');
		});
	});
}
