'use strict';

var projectController = require('../controllers/project'),
    taskController = require('../controllers/task'),
    commentController = require('../controllers/comments'),
    discussionController = require('../controllers/discussion'),
    profileController = require('../controllers/profile'),
    usersController = require('../controllers/users'),
    elasticsearchController = require('../controllers/elasticsearch'),
    attachmentsController = require('../controllers/attachments'),
    updatesController = require('../controllers/updates');

//var permissionController = require('../controllers/permission');

module.exports = function(Icapi, app, auth) {

    app.route('/api/projects')
    //.all(auth.requiresLogin, permissionController.echo)
        .post(projectController.create)
        .get(projectController.all);
    app.route('/api/projects/:id')
        .get(projectController.read)
        .put(projectController.update)
        .delete(projectController.destroy);
    app.route('/api/history/projects/:id')
        .get(projectController.readHistory);
    app.route('/api/:entity/:id/projects')
        .get(projectController.getByEntity);

    app.route('/api/tasks')
        .post(auth.requiresLogin, taskController.create)
        .options(function(req, res) {
            res.header('Access-Control-Allow-Methods', 'POST');
            res.header('Access-Control-Allow-Headers', 'accept, content-type, authorization');
            res.header('Access-Control-Max-Age', '1728000');
            res.send(200);
        })
        .get(taskController.all);
    app.route('/api/tasks/tags')
        .get(taskController.tagsList);
    app.route('/api/tasks/zombie')
        .get(taskController.getZombieTasks);
    app.route('/api/tasks/:id/star')
        .patch(taskController.starTask);
    app.route('/api/tasks/starred')
        .get(taskController.getStarredTasks);
    app.route('/api/tasks/:id')
        .get(taskController.read)
        .put(auth.requiresLogin, taskController.update)
        .delete(taskController.destroy);

    app.route('/api/:entity/:id/tasks')
        .get(taskController.getByDiscussion, taskController.getByEntity);
    app.route('/api/history/tasks/:id')
        .get(taskController.readHistory);

    app.route('/api/comments')
        .post(auth.requiresLogin, commentController.create)
        .get(commentController.all);
    app.route('/api/comments/:id')
        .get(commentController.read)
        .put(auth.requiresLogin, commentController.update)
        .delete(commentController.destroy);
    app.route('/api/history/comments/:id')
        .get(commentController.readHistory);

    app.route('/api/avatar')
        .post(auth.requiresLogin, profileController.profile, profileController.uploadAvatar, profileController.update);

    app.route('/api/users')
        .post(usersController.create)
        .get(usersController.all);
    app.route('/api/users/:id')
        .get(usersController.read)
        .put(auth.requiresLogin, usersController.update)
        .delete(usersController.destroy);
    app.route('/api/:entity/:id/users')
        .get(usersController.getByEntity);

    app.route('/api/attachments')
        .post(auth.requiresLogin, attachmentsController.upload, attachmentsController.create)
        .get(auth.requiresLogin, attachmentsController.query);
    app.route('/api/attachments/:id')
        .get(attachmentsController.read)
        .post(auth.requiresLogin, attachmentsController.update, attachmentsController.upload);
    app.route('/api/history/attachments/:id')
        .get(attachmentsController.readHistory);
    app.route('/api/attachments/upload')
        .post(auth.requiresLogin, attachmentsController.upload);
    app.route('/api/search')
        .get(elasticsearchController.search);

    app.route('/api/discussions')
        .post(discussionController.create)
        .get(discussionController.all);
    app.route('/api/discussions/:id')
        .get(discussionController.read)
        .put(discussionController.update)
        .delete(discussionController.destroy);
    app.route('/api/history/discussions/:id')
        .get(discussionController.readHistory);
    app.route('/api/discussions/:id/schedule')
        .post(discussionController.schedule);
    app.route('/api/discussions/:id/summary')
        .post(discussionController.summary);

    app.route('/api/updates')
        .post(updatesController.create)
        .get(updatesController.all);
    app.route('/api/updates/:id')
        .get(updatesController.read)
        .put(updatesController.update);
    //     // .delete(updatesController.destroy);
    app.route('/api/:entity/:id/updates')
        .get(updatesController.getByEntity);
    app.route('/api/history/updates/:id')
        .get(updatesController.readHistory);


    //temporary -because of swagger bug with 'tasks' word

    app.route('/api/task')
        .post(taskController.create)
        .get(taskController.all);
    app.route('/api/task/tags')
        .get(taskController.tagsList);
    app.route('/api/task/zombie')
        .get(taskController.getZombieTasks);
    app.route('/api/task/:id/star')
        .patch(taskController.starTask);
    app.route('/api/task/starred')
        .get(taskController.getStarredTasks);
    app.route('/api/task/:id')
        .get(taskController.read)
        .put(taskController.update)
        .delete(taskController.destroy);
};