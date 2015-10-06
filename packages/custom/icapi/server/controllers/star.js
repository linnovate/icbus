'use strict'

var starService = require('../services/star.js');

function starEntity(req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entityName = req.params.entity || req.locals.data.entityName;
  var entityService = starService(entityName, { user: req.user });

  entityService.starEntity(req.params.id).then(function(starred) {
    req.locals.result = { star: starred };
    next();
  });
}

function getStarred(req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entityName = req.params.entity || req.locals.data.entityName;
  var entityService = starService(entityName, { user: req.user });

  entityService.getStarred().then(function(starred) {
    req.locals.result = starred;
    next();
  });
}

function isStarred(req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entityName = req.params.entity || req.locals.data.entityName;
  var entityService = starService(entityName, { user: req.user });

  entityService.isStarred(req.locals.result).then(function() {
    next();
  });
}

module.exports = {
  starEntity: starEntity,
  getStarred: getStarred,
  isStarred: isStarred
};
