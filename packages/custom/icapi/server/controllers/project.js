'use strict';

require('../models/project');

var options = {
  includes: 'watchers',
  defaults: {
    watchers: []
  }
};

var crud = require('../controllers/crud.js');
var projectController = crud('projects', options);

var utils = require('./utils'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Task = mongoose.model('Task'),
  User = mongoose.model('User'),
  _ = require('lodash'),
  elasticsearch = require('./elasticsearch.js');

Object.keys(projectController).forEach(function(methodName) {
  if (methodName !== 'destroy') {
    exports[methodName] = projectController[methodName];
  }
});

exports.destroy = function(req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var project = req.locals.result;

  Task.find({ project: req.params.id }).then(function(tasks) {
    //FIXME: do it with mongo aggregate
    var groupedTasks = _.groupBy(tasks, function(task) {
      return task.discussions.length > 0
        ? 'release'
        : 'remove';
    });

    groupedTasks.remove = groupedTasks.remove || [];
    groupedTasks.release = groupedTasks.release || [];

    Task.update({ _id: { $in: groupedTasks.release }},
        {  project: null }).exec();

    Task.remove({ _id: { $in: groupedTasks.remove }}).then(function() {
      //FIXME: needs to be optimized to one query
      groupedTasks.remove.forEach(function(task) {
        elasticsearch.delete(task, 'task', null, next);
      });

      var removeTaskIds = _(groupedTasks.remove)
        .pluck('_id')
        .map(function(i) { return i.toString(); })
        .value();

      User.update({ 'profile.starredTasks': { $in: removeTaskIds } },
          { $pull: { 'profile.starredTasks': { $in: removeTaskIds } } }).exec();
    });

    User.update({ 'profile.starredProjects': project._id },
        { 'profile.starredProjects': { $pull: project._id } }).exec();

    projectController.destroy(req, res, next);
  });
};

exports.getByEntity = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entities = {users: 'creator', _id: '_id'},
    entityQuery = {};

  entityQuery[entities[req.params.entity]] = req.params.id;

  var Query = Project.find(entityQuery);

  Query.populate('watchers');

  Query.exec(function (err, projects) {
    utils.checkAndHandleError(err, 'Failed to read projects by' + req.params.entity + ' ' + req.params.id, next);

    res.status(200);
    return res.json(projects);
  });
};

exports.getByDiscussion = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (req.params.entity !== 'discussions') return next();

  var Query = Task.find({
    discussions: req.params.id,
    project: {$ne: null}
  }, {project: 1, _id: 0});
  Query.populate('project');

  Query.exec(function (err, projects) {
    utils.checkAndHandleError(err, res, 'Unable to get projects');

    // remove duplicates
    projects = _.uniq(projects, 'project._id');
    projects = _.map(projects, function (item) {
      return item.project;
    });


    res.status(200);
    return res.json(projects);
  });
};
