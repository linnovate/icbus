'use strict';

var projectController = require('../controllers/project');
var taskController = require('../controllers/task');
var profileController = require('../controllers/profile');
var usersController = require('../controllers/users');
var attachmentsController = require('../controllers/attachments');

var permissionController = require('../controllers/permission');

module.exports = function(Icapi, app, auth, database, elasticsearch) {

    app.route('/api/projects')
    //.all(auth.requiresLogin, permissionController.echo)
        .post(projectController.create)
        .get(projectController.read);
    app.route('/api/projects/:id')
        .put(projectController.update)
        .delete(projectController.destroy);

    app.route('/api/tasks')
        .post(taskController.create)
        .get(auth.requiresLogin, taskController.query);
    app.route('/api/tasks/tags')
        .get(taskController.tagsList);
    app.route('/api/tasks/:id')
        .get(taskController.read)
        .put(taskController.update)
        .delete(taskController.destroy);
    app.route('/api/:entity/:id/tasks')
        .get(taskController.getByEntity);
    app.route('/api/history/tasks/:id')
        .get(taskController.readHistory);

    app.route('/api/profile')
        .get(auth.requiresLogin, profileController.profile, profileController.show)
        .put(auth.requiresLogin, profileController.profile, profileController.update);
    app.route('/api/avatar')
        .post(auth.requiresLogin, profileController.profile, profileController.uploadAvatar, profileController.update)

    app.route('/api/users')
        .get(usersController.read);

    //temporary -because of swagger bug with 'tasks' word

    app.route('/api/task')
        .post(taskController.create)
        .get(taskController.query);
    app.route('/api/task/tags')
        .get(taskController.tagsList);
    app.route('/api/task/:id')
        .get(taskController.read)
        .put(taskController.update)
        .delete(taskController.destroy);
};