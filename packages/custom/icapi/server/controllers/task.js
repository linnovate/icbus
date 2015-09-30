'use strict';

var utils = require('./utils');

var mongoose = require('mongoose'),
  ObjectId = require('mongoose').Types.ObjectId;

require('../models/task');
var Task = mongoose.model('Task'),
  TaskArchive = mongoose.model('task_archive'),
  mean = require('meanio'),
  _ = require('lodash'),
  Update = mongoose.model('Update');

exports.read = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  Task.findById(req.params.id).populate('assign').populate('watchers').populate('project').exec(function (err, task) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t find task'
      };
    } else {
      req.locals.result = task;
    }

    next();
  });
};

exports.all = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var Query = Task.find({});
  Query.populate('assign').populate('watchers').populate('project');
  Query.exec(function (err, tasks) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t fetch tasks'
      };
    } else {
      req.locals.result = tasks;
    }

    next();
  });
};


exports.create = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var task = {
    creator: req.user,
    tags: []
  };

  if (req.body.discussion) {
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
  }, function (err, response) {
    utils.checkAndHandleError(err, 'Failed to create task', next);

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

    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t create task'
      };
    } else {
      req.locals.result = response;
    }

    next();
  });
};

exports.update = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (!req.params.id) {
    return res.send(404, 'Cannot update task without id');
  }

  Task.findById(req.params.id).exec(function (err, task) {
    if (err || !task) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t find task to update'
      };

      next();
    }

    delete req.body.__v;
    if (!req.body.assign && !task.assign) delete req.body.assign;
    if (!req.body.project && !task.project) delete req.body.project;

    var defaults = {
      project: undefined,
      assign: undefined,
      watchers: [],
      discussions: []
    };

    var newTask = _.defaults(req.body, defaults);

    if (req.body.discussion) {
      newTask.discussions = _.union(newTask.discussions, [req.body.discussion]);
    }

    task = _.extend(task, newTask);
    task.updated = new Date();

    var shouldCreateUpdate = task.description !== req.body.description;

    task.save({user: req.user, discussion: req.body.discussion}, function (err, result) {
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

      if (err) {
        req.locals.error = {
          status: 400,
          message: 'Can\'t create task'
        };
      } else {
        req.locals.result = result;
      }

      next();
    });
  });
};

exports.destroy = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (!req.params.id) {
    return res.send(404, 'Cannot destroy task without id');
  }

  Task.findById(req.params.id, function (err, task) {
    if (err || !task) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t find task'
      };

      next();
    }

    task.remove({user: req.user, discussion: req.body.discussion}, function (err, success) {
      if (err) {
        req.locals.error = {
          status: 400,
          message: 'Can\'t delete task'
        };
      } else {
        req.locals.result = success;
      }

      next();
    });
  });
};

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
  Query.populate('assign').populate('watchers').populate('project');

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

exports.readHistory = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    var Query = TaskArchive.find({
      'c._id': new ObjectId(req.params.id)
    });
    Query.populate('u');
    Query.populate('d');
    Query.exec(function (err, tasks) {
      utils.checkAndHandleError(err, 'Failed to read history for task ' + req.params.id, next);

      res.status(200);
      return res.json(tasks);
    });
  } else {
    utils.checkAndHandleError(true, 'Failed to read history for task ' + req.params.id, next);
  }
};

exports.getZombieTasks = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var Query = Task.find({project: {$eq: null}, discussions: {$size: 0}});
  Query.populate('assign').populate('watchers').populate('project');

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
