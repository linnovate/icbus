'use strict';
require('../models/discussion')
var utils = require('./utils'),
	mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId,
	Discussion = mongoose.model('Discussion'),
	DiscussionArchive = mongoose.model('discussion_archive'),
	TaskArchive = mongoose.model('task_archive'),
	Task = mongoose.model('Task'),
	_ = require('lodash'),
	elasticsearch = require('./elasticsearch'),
	mailManager = require('./mailManager'),
	mean = require('meanio'),
	Update = mongoose.model('Update');

exports.read = function (req, res, next) {
	Discussion.findById(req.params.id).populate('assign').populate('watchers').exec(function (err, discussion) {
		utils.checkAndHandleError(err ? err : !discussion, res, 'Failed to read discussion with id: ' + req.params.id);

		res.status(200);
		return res.json(discussion);
	});
};

exports.all = function (req, res) {
	var Query = Discussion.find({});
	Query.populate('assign').populate('watchers');

	Query.exec(function (err, tasks) {
		utils.checkAndHandleError(err, res, 'Failed to found discussion');

		res.status(200);
		return res.json(tasks);
	});

	//var query = {};
	//if (!(_.isEmpty(req.query))) {
	//	query = elasticsearch.advancedSearch(req.query);
	//}
    //
	//mean.elasticsearch.search({
	//	index: 'discussion',
	//	'body': query,
	//	size: 3000
	//}, function(err, response) {
	//	if (err)
	//		res.status(500).send('Failed to found discussion');
	//	else
	//		res.send(response.hits.hits.map(function(item) {
	//			return item._source
	//		}))
	//});
};

exports.create = function(req, res, next) {
	var discussion = {
		creator: req.user._id,
		created: new Date()
	};

	var defaults = {
		assign: undefined
	};
	var newDiscussion = _.defaults(defaults, req.body);
	discussion = _.extend(discussion, newDiscussion);

	new Discussion(discussion).save({
		user: req.user
	}, function(err, response) {
		utils.checkAndHandleError(err, res);

    new Update({
      creator: req.user,
      created: response.created,
      type: 'create',
      issueId: response._id,
      issue: 'discussion'
    }).save({
      user: req.user,
      discussion: req.body.discussion
    });

    req.params.id = response._id;
    exports.read(req, res, next);
		//res.json(response);
	});
};

exports.update = function (req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot update discussion without id');
	}
	Discussion.findById(req.params.id).populate('assign').populate('watchers').exec(function (err, discussion) {
		utils.checkAndHandleError(err, res);

		var shouldCreateUpdate = discussion.description !== req.body.description;
		if (!req.body.assign && !discussion.assign) delete req.body.assign;
		
		var defaults = {
			assign: undefined
		};
		var newDiscussion = _.defaults(defaults, req.body);
		discussion = _.extend(discussion, newDiscussion);
		discussion.updated = new Date();

		discussion.save({
			user: req.user
		}, function (err, discussion) {
			utils.checkAndHandleError(err, res, 'Failed to update discussion');

			if (shouldCreateUpdate) {
				new Update({
					creator: req.user,
					created: new Date(),
					type: 'update',
					issueId: discussion._id,
					issue: 'discussion'
				}).save({
						user: req.user,
						discussion: req.body.discussion
					}, function (err, update) {
					});
			}

			res.status(200);
			return res.json(discussion);
		});

	});
};

exports.destroy = function (req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot delete discussion without an id');
	}

	Discussion.findById(req.params.id, function (err, discussion) {
		utils.checkAndHandleError(
			err || !discussion, res, 'Cannot find discussion with id: ' + req.params.id);

		discussion.remove({
			user: req.user
		}, function (err, success) {
			utils.checkAndHandleError(err, res, 'Failed to destroy discussion');

			res.status(200);
			return res.send({message: (success ? 'Discussion deleted' : 'Failed to delete discussion')});
		});
	});
};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = DiscussionArchive.find({
			'c._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.exec(function(err, discussions) {
			utils.checkAndHandleError(err, res, 'Failed to read history for discussion ' + req.params.id);

			res.status(200);
			return res.json(discussions);
		});
	} else {
		utils.checkAndHandleError(true, res, 'Failed to read history for discussion ' + req.params.id);
	}
};

exports.schedule = function (req, res) {
	Discussion.findOne({
		_id: req.params.id
	}).populate('assign').populate('watchers').populate('creator').exec(function (err, discussion) {
		utils.checkAndHandleError(err, res, 'Failed to find discussion ' + req.params.id);
		utils.checkAndHandleError(!discussion.due, res, 'Due field cannot be empty');
		utils.checkAndHandleError(!discussion.assign, res, 'Assignee cannot be empty');

		var allowedStatuses = ['New', 'Scheduled', 'Cancelled'];
		if (allowedStatuses.indexOf(discussion.status) === -1) {
			utils.checkAndHandleError(true, res, 'Cannot be scheduled for this status');
		}

    var Query = TaskArchive.distinct('c._id' ,{
      'd': req.params.id
    });

    Query.exec(function(err, tasks) {
      utils.checkAndHandleError(err, res, 'Failed to read tasks for discussion ' + req.params.id);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');

      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, res, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id);

        var groupedTasks = _.groupBy(tasks, function(task) {
          return _.contains(task.tags, 'Agenda');
        });

        mailManager.sendEx('discussionSchedule', {
          discussion: discussion,
          agendaTasks: groupedTasks['true'] || [],
          additionalTasks: groupedTasks['false'] || []
        });
      });
    });

		discussion.status = 'Scheduled';

		discussion.save({
			user: req.user
		}, function (err, discussion) {
			utils.checkAndHandleError(err, res, 'Failed to update discussion');

			res.status(200);
			return res.json(discussion);
		});

	});
};

exports.summary = function (req, res) {
	Discussion.findOne({
		_id: req.params.id
	}).populate('assign').populate('watchers').populate('creator').exec(function (err, discussion) {
		utils.checkAndHandleError(err, res, 'Failed to find discussion ' + req.params.id);
		var allowedStatuses = ['Scheduled'];
		if (allowedStatuses.indexOf(discussion.status) === -1) {
			utils.checkAndHandleError(true, res, 'Cannot send summary for this status');
		}

    var Query = TaskArchive.distinct('c._id' ,{
      'd': req.params.id
    });

    Query.exec(function(err, tasks) {
      utils.checkAndHandleError(err, res, 'Failed to read tasks for discussion ' + req.params.id);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');
      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, res, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id);

        var projects = _.chain(tasks).pluck('project').compact().value();
        _.each(projects, function(project) {
          project.tasks = _.select(tasks, function(task) {
            return task.project === project;
          });
        });

        var additionalTasks = _.select(tasks, function(task) {
          return !task.project;
        });

        mailManager.sendEx('discussionSummary', {
          discussion: discussion,
          projects: projects,
          additionalTasks: additionalTasks
        });
      });
    });

		discussion.status = 'Done';
		discussion.save({
			user: req.user
		}, function (err, discussion) {
			utils.checkAndHandleError(err, res, 'Failed to update discussion');

			var Query = TaskArchive.distinct('c._id', {
				'd': discussion._id
			});
			Query.exec(function (err, tasks) {
				utils.checkAndHandleError(err, res, 'Failed to read tasks for discussion ' + discussion._id);

				var entityQuery = {};
				entityQuery._id = {$in: tasks};

				var Query = Task.find(entityQuery);

				Query.exec(function (err, tasks) {
					utils.checkAndHandleError(err, res, 'Failed to read tasks by discussion ' + discussion._id);

					_.map(tasks, function (task) {
						var index = task.tags.indexOf('Agenda');
						if (task.discussions.length === 1) {
							task.tags.splice(index, 1);
						}
					});

					res.status(200);
					return res.json(discussion);
				});
			});

		});
	});
};
