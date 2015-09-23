'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Project = mongoose.model('Project'),
  Task = mongoose.model('Task'),
  Discussion = mongoose.model('Discussion'),
  schemes = {projects: Project, tasks: Task, discussions: Discussion},
  _ = require('lodash'),
  Busboy = require('busboy'),
  fs = require('fs'),
  path = require('path'),
  utils = require('./utils'),
  config = require('meanio').loadConfig();

/**
 * Find profile by user id
 */
exports.profile = function (req, res, next) {
  User.findOne({
    _id: req.user._id
  }).exec(function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('Failed to load user'));
    req.profile = user.profile;
    next();
  });
};

/**
 * Update user profile
 */
exports.update = function (req, res, next) {
  req.profile = req.profile || {};
  var profile = _.extend(req.profile, req.body);

  var user = req.user;
  user.profile = profile;

  User.update({_id: user._id}, user, function (err) {
    utils.checkAndHandleError(err, 'Cannot update the profile', next);
    res.json(user.profile);
  });
};

/**
 * Update user avatar
 */
exports.uploadAvatar = function (req, res, next) {
  var busboy = new Busboy({
    headers: req.headers
  });

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var saveTo = config.root + '/packages/core/users/public/assets/img/avatar/' + req.user._id + '.' + path.basename(filename.split('.').slice(-1)[0]).toLowerCase();

    file.pipe(fs.createWriteStream(saveTo));
    req.body.avatar = config.hostname + '/users/assets/img/avatar/' + req.user._id + '.' + path.basename(filename.split('.').slice(-1)[0]).toLowerCase();
    req.file = true;
  });

  busboy.on('finish', function () {
    if (req.file)
      next();
    else
      utils.checkAndHandleError('Didn\'t find any avatar to upload', 'Didn\'t find any avatar to upload', next);
  });
  return req.pipe(busboy);
};

//star entity
exports.starEntity = function (req, res, next) {
  User.findOne({
    _id: req.user._id
  }, function (err, user) {
    utils.checkAndHandleError(err, 'Failed to load user', next);
    var starredEntities = 'starred' + req.params.entity.capitalizeFirstLetter();

    var query;
    if (!user.profile || !user.profile[starredEntities] || user.profile[starredEntities].indexOf(req.params.id) == -1) {
      query = {$push: {}};
      query.$push['profile.' + starredEntities] = req.params.id;
    }
    else {
      query = {$pull: {}};
      query.$pull['profile.' + starredEntities] = req.params.id;
    }

    user.update(query, function (err, updated) {

      utils.checkAndHandleError(err, 'Cannot update the starred ' + req.params.entity, next);
      res.json(updated);
    });
  })
};

//get starred entity list
exports.getStarredEntity = function (req, res, next) {
  User.findOne({
    _id: req.user._id
  }, function (err, user) {
    utils.checkAndHandleError(err, 'Failed to load user', next);

    var starredEntities = 'starred' + req.params.entity.capitalizeFirstLetter();

    if (!user.profile || !user.profile[starredEntities] || user.profile[starredEntities].length === 0) {
      res.json([]);
    } else {
      schemes[req.params.entity].find({
        '_id': {
          $in: user.profile[starredEntities]
        }
      }, function (err, list) {
        utils.checkAndHandleError(err, 'Failed to read ' + req.params.entity, next);

        res.status(200);
        return res.json(list);
      });
    }
  })
};

String.prototype.capitalizeFirstLetter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}
