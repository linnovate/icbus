'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;
var connectDomain = require('connect-domain');
var Icapi = new Module('icapi');

Icapi.register(function(app, auth, database, swagger) {
  app.use(connectDomain());

  //We enable routing. By default the Package Object is passed to the routes
  Icapi.routes(app, auth, database);

  swagger.add(__dirname);

  app.use(function (err, req, res, next) {
    var message = typeof err.message === 'string' ? {message: err.message} : err.message;
    res.status(500).send(message);
  });

  return Icapi;
});
