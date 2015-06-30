'use strict';

var utils = require('./utils');

var mongoose = require('mongoose');

require('../models/project');
var Project = mongoose.model('Project');
var rooms = require('../../../hi/server/controllers/rooms');

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
	//this is just sample - validation coming soon
	//We deal with each field individually unless it is in a schemaless object
	if (req.params.id) {
		return res.send(401, 'Cannot create project with predefined id');
	}
	req.user ={_id: '558a68473df99095392d88cc'}
	var data = {
		created: new Date(),
		updated: new Date(),
		title: req.body.title,
		parent: req.body.parent || null,
		color: req.body.color || null,
		discussion: req.body.discussion || null,
		creator : req.user._id
	};

	new Project(data).save(function(err, project ) {
		
		utils.checkAndHandleError(err,res);
		rooms.createForProject(project, function(roomId){
			project.room = roomId;
			project.save(function(err, project) {
				utils.checkAndHandleError(err,res);
				return res.status(200).json(project);
			});
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
		if (req.body.title) project.title = req.body.title;
		if (req.body.parent)  project.parent = req.body.parent;
		if (req.body.color)  project.color = req.body.color;

		project.save(function(err, project) {
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

	Project.remove({_id:req.params.id}, function(err, success) {
		
		utils.checkAndHandleError(err, res, 'Failed to destroy project');

		res.status(200);
		return res.send(success ? 'Project deleted': 'Failed to delete project');
	});
}
