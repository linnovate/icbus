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
		utils.checkAndHandleError(err ? err : !discussion, 'Failed to read discussion with id: ' + req.params.id, next);

		res.status(200);
		return res.json(discussion);
	});
};

exports.all = function (req, res, next) {
	var Query = Discussion.find({});
	Query.populate('assign').populate('watchers');

	Query.exec(function (err, tasks) {
		utils.checkAndHandleError(err, 'Failed to found discussion', next);

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
		utils.checkAndHandleError(err, 'Failed to create discussion', next);

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

	Discussion.findById(req.params.id).exec(function (err, discussion) {
		utils.checkAndHandleError(err, 'Failed to find discussion: ' + req.params.id);

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
			utils.checkAndHandleError(err, 'Failed to update discussion', next);

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

			//res.status(200);
			//return res.json(discussion);
            req.params.id = discussion._id;
            exports.read(req, res, next);
		});

	});
};

exports.destroy = function (req, res, next) {
	if (!req.params.id) {
		return res.send(404, 'Cannot delete discussion without an id');
	}

	Discussion.findById(req.params.id, function (err, discussion) {
		utils.checkAndHandleError(
        err || !discussion, 'Cannot find discussion with id: ' + req.params.id, next);

		discussion.remove({
			user: req.user
		}, function (err, success) {
			utils.checkAndHandleError(err, 'Failed to destroy discussion', next);

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
			utils.checkAndHandleError(err, 'Failed to read history for discussion ' + req.params.id, next);

			res.status(200);
			return res.json(discussions);
		});
	} else {
		utils.checkAndHandleError(true, 'Failed to read history for discussion ' + req.params.id, next);
	}
};

exports.schedule = function (req, res, next) {
	Discussion.findOne({
		_id: req.params.id
	}).populate('assign').populate('watchers').populate('creator').exec(function (err, discussion) {
		utils.checkAndHandleError(err, 'Failed to find discussion ' + req.params.id, next);
		utils.checkAndHandleError(!discussion.due, 'Due field cannot be empty', next);
		utils.checkAndHandleError(!discussion.assign, 'Assignee cannot be empty', next);

		var allowedStatuses = ['New', 'Scheduled', 'Cancelled'];
		if (allowedStatuses.indexOf(discussion.status) === -1) {
			utils.checkAndHandleError(true, 'Cannot be scheduled for this status', next);
		}

    var Query = TaskArchive.distinct('c._id' ,{
      'd': req.params.id
    });

    Query.exec(function(err, tasks) {
      utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + req.params.id, next);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');

      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id, next);

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
			utils.checkAndHandleError(err, 'Failed to update discussion', next);

			res.status(200);
			return res.json(discussion);
		});

	});
};

exports.summary = function (req, res, next) {
	Discussion.findOne({
		_id: req.params.id
	}).populate('assign').populate('watchers').populate('creator').exec(function (err, discussion) {
		utils.checkAndHandleError(err, 'Failed to find discussion ' + req.params.id, next);
		var allowedStatuses = ['Scheduled'];
		if (allowedStatuses.indexOf(discussion.status) === -1) {
			utils.checkAndHandleError(true, 'Cannot send summary for this status', next);
		}

    var Query = TaskArchive.distinct('c._id' ,{
      'd': req.params.id
    });

    Query.exec(function(err, tasks) {
      utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + req.params.id, next);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');
      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id, next);

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
			utils.checkAndHandleError(err, 'Failed to update discussion', next);

			var Query = TaskArchive.distinct('c._id', {
				'd': discussion._id
			});
			Query.exec(function (err, tasks) {
				utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + discussion._id, next);

				var entityQuery = {};
				entityQuery._id = {$in: tasks};

				var Query = Task.find(entityQuery);

				Query.exec(function (err, tasks) {
					utils.checkAndHandleError(err, 'Failed to read tasks by discussion ' + discussion._id, next);

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


exports.getByProject = function (req, res) {
	var Query = Task.find({
		project : req.params.id,
		discussions : {$not: {$size: 0}}
	}, {discussions : 1, _id : 0});
	Query.populate('discussions');

	Query.exec(function (err, discussions) {
		utils.checkAndHandleError(err, res, 'Unable to get discussions');

        //remove duplicates
        discussions = _.reduce(discussions, function(flattened, other) {
            return flattened.concat(other.discussions);
        }, []);

        discussions = _.uniq(discussions, '_id');

		res.status(200);
		return res.json(discussions);
	});
};
