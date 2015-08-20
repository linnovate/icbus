'use strict';
require('../models/project')
var utils = require('./utils'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId,
	Project = mongoose.model('Project'),
	User = mongoose.model('User'),
	ProjectArchive = mongoose.model('project_archive'),
	rooms = require('../../../hi/server/controllers/rooms'),
	_ = require('lodash'),
	elasticsearch = require('./elasticsearch'),
	mean = require('meanio');

exports.read = function(req, res, next) {
	Project.findById(req.params.id).populate('watchers').exec(function(err, project) {
		if (err || !project) utils.checkAndHandleError(err ? err : !project, res, {message: 'Failed to read project with id: ' + req.params.id});
		else {
			res.status(200);
			return res.json(project);
		}
	});
};

exports.all = function(req, res) {
    var Query = Project.find({});
    Query.populate('watchers');

    Query.exec(function(err, tasks) {
        if(err)
            utils.checkAndHandleError(err, res, 'Failed to found projects');

        res.status(200);

        return res.json(tasks);
    });

    //from elasticsearch
	//var query = {};
	//if (!(_.isEmpty(req.query))) {
	//	query = elasticsearch.advancedSearch(req.query);
	//}
    //
	//mean.elasticsearch.search({index:'project','body': query, size:3000}, function(err,response) {
	//	if (err)
	//		res.status(500).send('Failed to found project');
	//	else
	//		res.send(response.hits.hits.map(function(item) {return item._source}))
	//});
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
		if (!project) utils.checkAndHandleError(true, res, 'Cannot find project with id: ' + req.params.id);
		else {
			project.updated = new Date();
			if (req.body.title) project.title = req.body.title;
			if (req.body.parent)  project.parent = req.body.parent;
			if (req.body.color)  project.color = req.body.color;
			if (req.body.watchers)  project.watchers = req.body.watchers;

			project.save({user: req.user, discussion: req.body.discussion}, function(err, project) {
				utils.checkAndHandleError(err, res, 'Failed to update project');

				res.status(200);
				return res.json(project);
			});
		}
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
				return res.send({message: (success ? 'Project deleted' : 'Failed to delete project')});
			});
	});
};

exports.getByEntity = function(req, res) {
    var entities = {users: 'creator', _id: '_id'},
        entityQuery = {};
    entityQuery[entities[req.params.entity]] = req.params.id;

    var Query = Project.find(entityQuery);

    Query.populate('watchers');

    Query.exec(function(err, projects) {
        if(err)
            utils.checkAndHandleError(err, res, 'Failed to read projects by' + req.params.entity + ' ' + req.params.id);

        res.status(200);

        return res.json(projects);
    });

	//var entities = {users: 'creator', _id: '_id'},
	//	entity = entities[req.params.entity],
	//	query = {
	//		query: {
	//			filtered: {
	//				filter : {
	//					terms: {}
	//				}
	//			}
	//		}
	//};
	//if (!(req.params.id instanceof Array)) req.params.id = [req.params.id];
	//query.query.filtered.filter.terms[entity] =  req.params.id;
	//mean.elasticsearch.search({index:'project','body': query, size:3000}, function(err,response) {
	//	res.send(response.hits.hits.map(function(item) {return item._source}))
	//});
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

exports.starProject = function(req, res){
	User.findById(req.user._id, function(err, user){
		utils.checkAndHandleError(err, res, 'Failed to load user');
		var set;
		if (!user.profile || !user.profile.starredProjects){
			set = {'profile.starredProjects': [req.params.id] };
		}
		else {
			if (user.profile.starredProjects.indexOf(req.params.id) > -1)
				set = { $pull: { 'profile.starredProjects': req.params.id } };
			else
				set = { $push: { 'profile.starredProjects': req.params.id } };
		}
		user.update(set, function(err, updated) {
			utils.checkAndHandleError(err, res,'Cannot update the starred projects');
			res.json(updated);
		});
	})
};

exports.getStarredProjects = function(req, res) {
	User.findById(req.user._id, function(err, user) {
		utils.checkAndHandleError(err, res, 'Failed to load user');
		if (!user.profile || !user.profile.starredProjects || user.profile.starredProjects.length == 0) {
			res.json([]);
		} else {
			Project.find({
				'_id': {
					$in: user.profile.starredProjects
				}
			}, function(err, projects) {
				utils.checkAndHandleError(err, res, 'Failed to read projects');
				res.status(200);
				return res.json(projects);
			});
		}
	})
};