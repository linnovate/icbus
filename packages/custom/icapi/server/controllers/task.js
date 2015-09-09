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

exports.read = function (req, res, next) {
	Task.findById(req.params.id).populate('assign').populate('watchers').populate('project').exec(function (err, task) {
		utils.checkAndHandleError(err ? err : !task, res, 'Failed to read task with id: ' + req.params.id);

		res.status(200);
		return res.json(task);
	});
};

exports.all = function (req, res) {
	var Query = Task.find({});
	Query.populate('assign' ).populate('watchers').populate('project');
	Query.exec(function (err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to found tasks');
		res.status(200);

		return res.json(tasks);
	});

	//var query = {};
	//if (!(_.isEmpty(req.query))) {
	//	query = elasticsearch.advancedSearch(req.query);
	//}
	//mean.elasticsearch.search({index:'task','body': query, size: 3000}, function(err,response) {
	//	if (err)
	//		res.status(500).send('Failed to found tasks');
	//	else {
     //       res.send(response.hits.hits.map(function(item) {return item._source}));
     //   }
    //
	//});
};


exports.create = function(req, res, next) {
	var task = {
		creator: req.user,
    tags: []
	};
    if(req.body.discussion) {
        task.discussions = [req.body.discussion];
        task.tags.push('Agenda');
    }

	var defaults = {
		project: undefined,
		assign: undefined
	};
	var newTask = _.defaults(defaults, req.body);
	task = _.extend(task, newTask);

	new Task(task).save({
		user: req.user,
		discussion: req.body.discussion
	}, function(err, response) {
		utils.checkAndHandleError(err, res);

		new Update({
			creator: req.user,
			created: response.created,
			type: 'create',
			issueId: response._id,
			issue: 'task'
		}).save({
			user: req.user,
			discussion: req.body.discussion
		});

        req.params.id = response._id;
        exports.read(req, res, next);
	});
};

exports.update = function(req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot update task without id');
	}
	Task.findById(req.params.id).populate('watchers').populate('project').populate('assign').exec(function (err, task) {
      utils.checkAndHandleError(err, res);
      utils.checkAndHandleError(!task, res, 'Cannot find task with id: ' + req.params.id);

        delete req.body.__v;
		if(!req.body.assign && !task.assign) delete req.body.assign;
		if(!req.body.project && !task.project) delete req.body.project;

		var defaults = {
			project: undefined,
			assign: undefined
		};
		var newTask = _.defaults(defaults, req.body);
        task = _.extend(task, newTask);
        task.updated = new Date();

        var shouldCreateUpdate = task.description !== req.body.description;

        task.save({user: req.user, discussion: req.body.discussion}, function(err, result) {
            utils.checkAndHandleError(err, res);

            if (shouldCreateUpdate) {
                new Update({
                  creator: req.user,
                  created: new Date(),
                  type: 'update',
                  issueId: result._id,
                  issue: 'task'
                }).save({
                  user: req.user,
                  discussion: req.body.discussion
                });
            }

            req.params.id = task._id;
            exports.read(req, res, next);
            //res.status(200);
            //return res.json(task);
        });
	});
};

exports.destroy = function (req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot destroy task without id');
	}

	Task.findById(req.params.id, function (err, task) {
		utils.checkAndHandleError(err, res);
		utils.checkAndHandleError(!task, res, 'Cannot find task with id: ' + req.params.id);

		task.remove({user: req.user, discussion: req.body.discussion}, function (err, success) {
			utils.checkAndHandleError(err, res, 'Failed to destroy task');
			res.status(200);
			return res.send({message: (success ? 'Task deleted' : 'Failed to delete task')});
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
		res.send(response.facets ? response.facets.tags.terms : []);
	});
};

exports.getByEntity = function (req, res) {
	var entities = {projects: 'project', users: 'assign', tags: 'tags', _id: '_id'},
		entityQuery = {};
    entityQuery[entities[req.params.entity]] = (req.params.id instanceof Array) ? {$in: req.params.id} : req.params.id;

	var Query = Task.find(entityQuery);
	Query.populate('assign').populate('watchers').populate('project');

	Query.exec(function (err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id);

		res.status(200);
		return res.json(tasks);
	});

    //var entity = entities[req.params.entity],
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
	//mean.elasticsearch.search({index:'task','body': query, size:3000}, function(err,response) {
	//	if(err) {
	//		res.status(500).send([]);
	//	}
	//	else res.send(response.hits.hits.map(function(item) {return item._source}))
	//});
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
	} else {
		utils.checkAndHandleError(true, res, 'Failed to read history for task ' + req.params.id);
	}
};

exports.starTask = function(req, res) {
	User.findById(req.user._id, function(err, user) {
		utils.checkAndHandleError(err, res, 'Failed to load user');

		var query;
		if (!user.profile || !user.profile.starredTasks) {
			query = {'profile.starredTasks': [req.params.id]};
		} else {
			if (user.profile.starredTasks.indexOf(req.params.id) > -1)
				query = {$pull: {'profile.starredTasks': req.params.id}};
			else
				query = {$push: {'profile.starredTasks': req.params.id}};
		}
		user.update(query, function(err, updated) {
			utils.checkAndHandleError(err, res,'Cannot update the starred tasks');
			res.json(updated);
		});
	})
};


exports.getStarredTasks = function(req, res) {
	User.findById(req.user._id, function(err, user) {
		utils.checkAndHandleError(err, res, 'Failed to load user');

		if (!user.profile || !user.profile.starredTasks || user.profile.starredTasks.length === 0) {
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

exports.getZombieTasks = function (req, res) {

    var Query = Task.find({project: {$eq: null}, discussions: {$size: 0}});
    Query.populate('assign').populate('watchers').populate('project');

    Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, res, 'Failed to read tasks.');

        res.status(200);
        return res.json(tasks);
    });

};
