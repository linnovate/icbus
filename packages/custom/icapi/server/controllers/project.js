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
  Update = mongoose.model('Update');

exports.read = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  Project.findById(req.params.id).populate('watchers').exec(function (err, project) {
    if (err || !project) {
      req.locals.error = {
        status: 404,
        message: 'Can\'t find project'
      };
    } else {
      req.locals.result = project;
    }

    next();
  });
};

exports.all = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var Query = Project.find({});
  Query.populate('watchers');

  Query.exec(function (err, projects) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t fetch projects'
      };
    } else {
      req.locals.result = projects;
    }

    next();
  });
};

exports.create = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var project = {
    creator: req.user._id
  };
  project = _.extend(project, req.body);

  new Project(project).save({user: req.user, discussion: req.body.discussion}, function (err, response) {
    if (err) {
      req.locals.error = {
        status: 400,
        message: 'Can\'t find project'
      };
    } else {
      req.locals.result = response;
    }

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

    next();
  });
};

exports.update = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  if (!req.params.id) {
    req.locals.error = {
      status: 400,
      message: 'Can\'t find project'
    };

    next();
  }

  Project.findById(req.params.id).exec(function (err, project) {
    utils.checkAndHandleError(err, 'Cannot find project with id: ' + req.params.id, next);
    utils.checkAndHandleError(!project, 'Cannot find project with id: ' + req.params.id, next);


    var shouldCreateUpdate = project.description !== req.body.description;
    project = _.extend(project, req.body);
    project.save({user: req.user, discussion: req.body.discussion}, function (err, project) {
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

      if (err) {
        req.locals.error = {
          status: 400,
          message: 'Can\'t find project'
        };
      } else {
        req.locals.result = project;
      }
    });
  });
};

exports.destroy = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

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

      res.status(200);
      return res.send({message: (success ? 'Project deleted' : 'Failed to delete project')});
    });
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

exports.readHistory = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

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

exports.starProject = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  User.findById(req.user._id, function (err, user) {
    utils.checkAndHandleError(err, 'Failed to load user', next);
    var query;
    if (!user.profile || !user.profile.starredProjects) {
      query = {'profile.starredProjects': [req.params.id]};
    }
    else {
      if (user.profile.starredProjects.indexOf(req.params.id) > -1)
        query = {$pull: {'profile.starredProjects': req.params.id}};
      else
        query = {$push: {'profile.starredProjects': req.params.id}};
    }
    user.update(query, function (err, updated) {
      utils.checkAndHandleError(err, 'Cannot update the starred projects', next);
      res.json(updated);
    });
  })
};

exports.getStarredProjects = function (req, res, next) {
  if (req.locals.error) {
    return next();
  }

  User.findById(req.user._id, function (err, user) {
    utils.checkAndHandleError(err, 'Failed to load user', next);
    if (!user.profile || !user.profile.starredProjects || user.profile.starredProjects.length === 0) {
      res.json([]);
    } else {
      Project.find({
        '_id': {
          $in: user.profile.starredProjects
        }
      }, function (err, projects) {
        utils.checkAndHandleError(err, 'Failed to read projects', next);

        res.status(200);
        return res.json(projects);
      });
    }
  })
};
