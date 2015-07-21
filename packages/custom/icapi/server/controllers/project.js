'use strict';
require('../models/project')
var utils = require('./utils'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId,
	Project = mongoose.model('Project'),
	ProjectArchive = mongoose.model('project_archive'),
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
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = elasticsearch.advancedSearch(req.query);
	}

	mean.elasticsearch.search({index:'project','body': query, size:3000}, function(err,response) {
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
	rooms.createForProject(project)
		.then(function (roomId) {
			project.room = roomId;
		}, function (error) {
			console.log('cannot create a room in lets-chat '+ error);
		})
		.done(function(){
			new Project(project).save({user: req.user, discussion: req.body.discussion}, function(err, response) {
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
		if (req.body.title) project.title = req.body.title;
		if (req.body.parent)  project.parent = req.body.parent;
		if (req.body.color)  project.color = req.body.color;

		project.save({user: req.user, discussion: req.body.discussion}, function(err, project) {
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
		if (!project) utils.checkAndHandleError('Cannot find project with id: ' + req.params.id, res, 'Cannot find project with id: ' + req.params.id);
		else
			project.remove({
				user: req.user, discussion: req.body.discussion
			}, function(err, success) {
				utils.checkAndHandleError(err, res, 'Failed to destroy project');

				res.status(200);
				return res.send(success ? 'Project deleted' : 'Failed to delete project');
			});
	});
};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = ProjectArchive.find({
			'c._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.exec(function(err, projects) {
			utils.checkAndHandleError(err, res, 'Failed to read history for project ' + req.params.id);

			res.status(200);
			return res.json(projects);
		});
	} else
		utils.checkAndHandleError(req.params.id + ' is not a mongoose ObjectId', res, 'Failed to read history for project ' + req.params.id);
};