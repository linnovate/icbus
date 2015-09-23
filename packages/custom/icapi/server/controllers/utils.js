'use strict';

var inspect = require('util').inspect;

exports.checkAndHandleError = function (err, defaultMessage, next) {
  if (err) {
    var errMesg = defaultMessage || err.errors || err.message || 'Oops...';
    next(new Error(errMesg));
  }
};

exports.errorHandler = function (err, req, res, next) {
  console.log(inspect(err.message));
  console.log(inspect(err.stack));

  if (res.headersSent) {
    next(err);
  }

  res.status(500);
  res.send(err.message);
};
