'use strict';

var projectController = require('../controllers/project'),
  taskController = require('../controllers/task'),
  commentController = require('../controllers/comments'),
  discussionController = require('../controllers/discussion'),
  profileController = require('../controllers/profile'),
  usersController = require('../controllers/users'),
  elasticsearchController = require('../controllers/elasticsearch'),
  attachmentsController = require('../controllers/attachments'),
  updatesController = require('../controllers/updates'),
  utils = require('../controllers/utils.js');

var authorization = require('../middlewares/auth.js');
var locals = require('../middlewares/locals.js');
var response = require('../middlewares/response.js');
var error = require('../middlewares/error.js');

//var permissionController = require('../controllers/permission');

module.exports = function (Icapi, app, auth) {
  app.route('/api/*').all(locals);
  app.route('/api/*').all(authorization);

  //star & get starred list
  app.route('/api/:entity/:id/star')
    .patch(profileController.starEntity);
  app.route('/api/:entity/starred')
    .get(profileController.getStarredEntity);

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
    .get(projectController.getByDiscussion, projectController.getByEntity);

  app.route('/api/tasks')
    .post(taskController.create)
    .get(taskController.all);
  app.route('/api/tasks/tags')
    .get(taskController.tagsList);
  app.route('/api/tasks/zombie')
    .get(taskController.getZombieTasks);
  app.route('/api/tasks/:id')
    .get(taskController.read)
    .put(taskController.update)
    .delete(taskController.destroy);

  app.route('/api/:entity/:id/tasks')
    .get(taskController.getByDiscussion, taskController.getByEntity);
  app.route('/api/history/tasks/:id')
    .get(taskController.readHistory);

  app.route('/api/comments')
    .post(commentController.create)
    .get(commentController.all);
  app.route('/api/comments/:id')
    .get(commentController.read)
    .put(commentController.update)
    .delete(commentController.destroy);
  app.route('/api/history/comments/:id')
    .get(commentController.readHistory);

  app.route('/api/avatar')
    .post(profileController.profile, profileController.uploadAvatar, profileController.update);

  app.route('/api/users')
    .post(usersController.create)
    .get(usersController.all);
  app.route('/api/users/:id')
    .get(usersController.read)
    .put(usersController.update)
    .delete(usersController.destroy);
  app.route('/api/:entity/:id/users')
    .get(usersController.getByEntity);

  app.route('/api/attachments')
    .post(attachmentsController.upload, attachmentsController.create)
    .get(attachmentsController.query);
  app.route('/api/attachments/:id')
    .get(attachmentsController.read)
    .post(attachmentsController.update, attachmentsController.upload);
  app.route('/api/history/attachments/:id')
    .get(attachmentsController.readHistory);
  app.route('/api/:entity/:id/attachments')
    .get(attachmentsController.getByEntity);
  app.route('/api/attachments/upload')
    .post(attachmentsController.upload);
  app.route('/api/search')
    .get(elasticsearchController.search);

  app.route('/api/discussions')
    .post(discussionController.create)
    .get(discussionController.all);
  app.route('/api/history/discussions/:id')
    .get(discussionController.readHistory);
  app.route('/api/discussions/:id')
    .get(discussionController.read)
    .put(discussionController.update)
    .delete(discussionController.destroy);
  app.route('/api/discussions/:id/schedule')
    .post(discussionController.schedule);
  app.route('/api/discussions/:id/summary')
    .post(discussionController.summary);
  app.route('/api/:entity/:id/discussions')
    .get(discussionController.getByProject); //, discussionController.getByEntity);

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

  app.route('/api/task/tags')
    .get(taskController.tagsList);
  app.route('/api/task/zombie')
    .get(taskController.getZombieTasks);
  app.route('/api/task/:id')
    .get(taskController.read)
    .put(taskController.update)
    .delete(taskController.destroy);

  app.route('/api/*').all(response);
  app.route('/api/*').all(error);

  //app.use(utils.errorHandler);
};
