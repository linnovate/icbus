'use strict';

module.exports = function(req, res, next) {
  req.locals = {};
  next();
}
