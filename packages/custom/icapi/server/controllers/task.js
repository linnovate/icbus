'use strict';

var utils = require('./utils');

var mongoose = require('mongoose');

var options = {
  includes: 'assign watchers project',
  defaults: {
    project: undefined,
    assign: undefined,
    watchers: []
  }
};

var crud = require('../controllers/crud.js');
var task = crud('tasks', options);

require('../models/task');
var Task = mongoose.model('Task'),
  TaskArchive = mongoose.model('task_archive'),
  mean = require('meanio');

Object.keys(task).forEach(function(methodName) {
  exports[methodName] = task[methodName];
});

exports.tagsList = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var query = {
    'query': {'query_string': {'query': '*'}},
    'facets': {
      'tags': {'terms': {'field': 'tags'}}
    }
  };

  mean.elasticsearch.search({index: 'task', 'body': query, size: 3000}, function (err, response) {
      if (err) {
        req.locals.error = {
          status: 400,
          message: 'Can\'t get tags'
        };
      } else {
        req.locals.result = response.facets ? response.facets.tags.terms : [];
      }

      next();
  });
};

exports.getByEntity = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entities = {projects: 'project', users: 'assign', tags: 'tags', _id: '_id'},
    entityQuery = {};
  entityQuery[entities[req.params.entity]] = (req.params.id instanceof Array) ? {$in: req.params.id} : req.params.id;

  var Query = Task.find(entityQuery);
  Query.populate(options.includes);

  Query.exec(function (err, tasks) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t get tags'
      };
    } else {
      req.locals.result = tasks;
    }

    next();
  });
};

exports.getByDiscussion = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (req.params.entity !== 'discussions') return next();

  var Query = TaskArchive.distinct('c._id', {
    'd': req.params.id
  });
  Query.exec(function (err, tasks) {
    utils.checkAndHandleError(err, 'Failed to read tasks for discussion ' + req.params.id, next);

    req.params.id = tasks;
    req.params.entity = '_id';
    next();
  });
};

exports.getZombieTasks = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var Query = Task.find({project: {$eq: null}, discussions: {$size: 0}});
  Query.populate(options.includes);

  Query.exec(function (err, tasks) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t get zombie tasks'
      };
    } else {
      req.locals.result = tasks;
    }

    next();
  });
};
