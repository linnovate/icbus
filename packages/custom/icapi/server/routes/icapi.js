'use strict';

var projectController = require('../controllers/project');
var taskController = require('../controllers/task');

var permissionController = require('../controllers/permission');

module.exports = function(Icapi, app, auth, database, elasticsearch) {

  app.route('/api/projects/:id?')
    //.all(auth.requiresLogin, permissionController.echo)
    .post(projectController.create)
    .get(projectController.read)
    .put(projectController.update)
    .delete(projectController.destroy);


  app.route('/api/tasks/')
    //.all(permissionController.echo)
    .post(taskController.create)
    .get(taskController.query);
  app.route('/api/tasks/tags')
      .get(taskController.tagsList);
  app.route('/api/tasks/:id')
      .get(taskController.read)
      .put(taskController.update)
      .delete(taskController.destroy);
  app.route('/api/:entity/:id/tasks')
      .get(taskController.getByEntity);
};
