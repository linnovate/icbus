'use strict';

var projectController = require('../controllers/project');
var taskController = require('../controllers/task');

var permissionController = require('../controllers/permission');

module.exports = function(Icapi, app, auth, database) {

  app.route('/api/projects/:id?')
    //.all(auth.requiresLogin, permissionController.echo)
    //.post(permissionController.forceLogIn, projectController.create)     	//Create
    .post(projectController.create)     	//Create
    .get(projectController.read)        									//Read
    .put(projectController.update)      									//Update
    .delete(projectController.destroy); 									//Delete

  app.route('/api/tasks/:id?')
    //.all(permissionController.echo)
    //.post(permissionController.forceLogIn, taskController.create)
    .post(taskController.create)
    .get(taskController.read)
    .put(taskController.update)
    .delete(taskController.destroy);
};
