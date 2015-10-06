'use strict';

var options = {
  includes: 'watchers',
  defaults: {
    watchers: [],
    assign: undefined
  }
};

var crud = require('../controllers/crud.js');
var discussion = crud('discussions', options);

var utils = require('./utils'),
  mongoose = require('mongoose'),
  Discussion = require('../models/discussion'),
  TaskArchive = mongoose.model('task_archive'),
  Task = mongoose.model('Task'),
  _ = require('lodash'),
  mailService = require('../services/mail');

Object.keys(discussion).forEach(function(methodName) {
  exports[methodName] = discussion[methodName];
});

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

    var Query = TaskArchive.distinct('c._id', {
      'd': req.params.id
    });

    Query.exec(function (err, tasks) {
      utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + req.params.id, next);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');

      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id, next);

        var groupedTasks = _.groupBy(tasks, function (task) {
          return _.contains(task.tags, 'Agenda');
        });

        mailService.send('discussionSchedule', {
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

    var Query = TaskArchive.distinct('c._id', {
      'd': req.params.id
    });

    Query.exec(function (err, tasks) {
      utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + req.params.id, next);

      var entityQuery = {};
      entityQuery._id = {$in: tasks};
      var Query = Task.find(entityQuery);

      Query.populate('project');
      Query.exec(function (err, tasks) {
        utils.checkAndHandleError(err, 'Failed to read tasks by' + req.params.entity + ' ' + req.params.id, next);

        var projects = _.chain(tasks).pluck('project').compact().value();
        _.each(projects, function (project) {
          project.tasks = _.select(tasks, function (task) {
            return task.project === project;
          });
        });

        var additionalTasks = _.select(tasks, function (task) {
          return !task.project;
        });

        mailService.send('discussionSummary', {
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
            if (task.discussions.length === 1) {
              var tagIndex = task.tags.indexOf('Agenda');

              if (tagIndex !== -1) {
                task.tags.splice(tagIndex, 1);
                task.save({user: req.user});
              }
            }
          });

          res.status(200);
          return res.json(discussion);
        });
      });

    });
  });
};

exports.getByProject = function (req, res, next) {
  var entities = {projects: 'project'},
    entityQuery = {discussions: {$not: {$size: 0}}};

  entityQuery[entities[req.params.entity]] = req.params.id;

  var Query = Task.find(entityQuery, {discussions: 1, _id: 0});
  Query.populate('discussions');

  Query.exec(function (err, discussions) {
    console.log(err, 'err')
    utils.checkAndHandleError(err, 'Unable to get discussions', next);

    //remove duplicates
    discussions = _.reduce(discussions, function (flattened, other) {
      return flattened.concat(other.discussions);
    }, []);

    discussions = _.uniq(discussions, '_id');

    res.status(200);
    return res.json(discussions);
  });
};
