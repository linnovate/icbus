'use strict';

var _ = require('lodash');
var crudService = require('../services/crud.js');

module.exports = function(entityName, options) {
  var entityService = crudService(entityName, options);

  var success = function(req, next) {
    return function(data) {
      if (_.isEmpty(data)) {
        req.locals.error = {
          status: 404,
          message: 'Entity not found'
        };

        return next();
      }

      req.locals.result = data;
      next();
    }
  }

  var error = function(req, next) {
    return function(err) {
      req.locals.error = {
        status: 400,
        message: err.toString()
      };

      next();
    }
  }

  function all(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .all()
      .then(success(req, next), error(req, next));
  }

  function read(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .read(req.params.id)
      .then(success(req, next), error(req, next));
  }

  function create(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .create(req.body, { user: req.user, discussion: req.discussion })
      .then(success(req, next), error(req, next));
  }

  function update(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .update(req.locals.result, req.body, { user: req.user, discussion: req.discussion })
      .then(success(req, next), error(req, next));
  }

  function destroy(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .destroy(req.params.id)
      .then(success(req, next), error(req, next));
  }

  function readHistory(req, res, next) {
    if (req.locals.error) {
      return next();
    }

    entityService
      .readHistory(req.params.id)
      .then(success(req, next), error(req, next));
  }

  return {
    all: all,
    create: create,
    read: read,
    update: update,
    destroy: destroy,
    readHistory: readHistory
  };
}
