'use strict';

require('../models/project');

var options = {
  includes: 'watchers',
  defaults: {
    watchers: []
  }
};

var crud = require('../controllers/crud.js');
var project = crud('projects', options);

var utils = require('./utils'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Task = mongoose.model('Task'),
  _ = require('lodash');

Object.keys(project).forEach(function(methodName) {
  exports[methodName] = project[methodName];
});

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
