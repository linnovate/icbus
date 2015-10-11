'use strict';

require('../models/project');

var utils = require('./utils'),
  mongoose = require('mongoose'),
  ObjectId = require('mongoose').Types.ObjectId,
  Project = mongoose.model('Project'),
  Task = mongoose.model('Task'),
  User = mongoose.model('User'),
  ProjectArchive = mongoose.model('project_archive'),
  _ = require('lodash'),
  Update = mongoose.model('Update'),
  tasksCntrl = require('./task');

exports.read = function (req, res, next) {
  Project.findById(req.params.id).populate('watchers').exec(function (err, project) {
    utils.checkAndHandleError(err ? err : !project, 'Failed to read project with id: ' + req.params.id, next);

    res.status(200);
    return res.json(project);
  });
};

exports.all = function (req, res, next) {
  var Query = Project.find({});
  Query.populate('watchers');

  Query.exec(function (err, tasks) {
    utils.checkAndHandleError(err, 'Failed to found projects', next);

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

exports.create = function (req, res, next) {
  var project = {
    creator: req.user._id
  };
  project = _.extend(project, req.body);

  new Project(project).save({user: req.user, discussion: req.body.discussion}, function (err, response) {
    utils.checkAndHandleError(err, 'Failed to create project', next);

    new Update({
      creator: req.user,
      created: response.created,
      type: 'create',
      issueId: response._id,
      issue: 'project'
    }).save({
        user: req.user,
        discussion: req.body.discussion
      });

    req.params.id = response._id;
    exports.read(req, res, next);
  });
};

exports.update = function (req, res, next) {
  if (!req.params.id) {
    return res.send(404, 'Cannot update project without id');
  }

  Project.findById(req.params.id).exec(function (err, project) {
    utils.checkAndHandleError(err, 'Cannot find project with id: ' + req.params.id, next);
    utils.checkAndHandleError(!project, 'Cannot find project with id: ' + req.params.id, next);


    var shouldCreateUpdate = project.description !== req.body.description;
    project = _.extend(project, req.body);
    project.save({user: req.user, discussion: req.body.discussion}, function (err, project) {
      utils.checkAndHandleError(err, 'Failed to update project', next);

      if (shouldCreateUpdate) {
        new Update({
          creator: req.user,
          created: new Date(),
          type: 'update',
          issueId: project._id,
          issue: 'project'
        }).save({
            user: req.user,
            discussion: req.body.discussion
          });
      }

      req.params.id = project._id;
      exports.read(req, res, next);
      //res.status(200);
      //return res.json(project);
    });
  });
};

exports.destroy = function (req, res, next) {
  if (!req.params.id) {
    return res.send(404, 'Cannot destroy project without id');
  }

  Project.findById(req.params.id, function (err, project) {
    utils.checkAndHandleError(err, 'Cannot find project with id: ' + req.params.id, next);
    utils.checkAndHandleError(!project, 'Cannot find project with id: ' + req.params.id, next);

    project.remove({
      user: req.user, discussion: req.body.discussion
    }, function (err, success) {
      utils.checkAndHandleError(err, 'Failed to destroy project', next);

      //remove tasks from this project
      var query = {
        project: req.params.id,
        discussions: {$size: 0}
      };
      tasksCntrl.removeTaskByProject(req, query, next)
        .then(function(){
          res.status(200);
          return res.send({message: (success ? 'Project deleted' : 'Failed to delete project')});
        });
    });
  });
};

exports.getByEntity = function (req, res, next) {
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

exports.getByDiscussion = function (req, res, next) {
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

exports.readHistory = function (req, res, next) {
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    var Query = ProjectArchive.find({
      'c._id': new ObjectId(req.params.id)
    });
    Query.populate('u');
    Query.exec(function (err, projects) {
      utils.checkAndHandleError(err, 'Failed to read history for project ' + req.params.id, next);

      res.status(200);
      return res.json(projects);
    });
  } else {
    utils.checkAndHandleError(true, 'Failed to read history for project ' + req.params.id, next);
  }
};
