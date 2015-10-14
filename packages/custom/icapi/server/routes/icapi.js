'use strict';

var project = require('../controllers/project');
var task = require('../controllers/task');
var comment = require('../controllers/comments');
var discussion = require('../controllers/discussion');
var profile = require('../controllers/profile');
var users = require('../controllers/users');
var updates = require('../controllers/updates');

var attachments = require('../controllers/attachments');
var star = require('../controllers/star');
var elasticsearch = require('../controllers/elasticsearch');

var authorization = require('../middlewares/auth.js');
var locals = require('../middlewares/locals.js');
var entity = require('../middlewares/entity.js');
var response = require('../middlewares/response.js');
var pagination = require('../middlewares/pagination.js');
var error = require('../middlewares/error.js');

module.exports = function (Icapi, app) {
  app.route('/api/*').all(locals);
  app.route('/api/*').all(authorization);

  //star & get starred list
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/star')
    .patch(star.starEntity);
  app.route('/api/:entity(tasks|discussions|projects)/starred')
    .get(star.getStarred);

  app.route('/api/projects*').all(entity('projects'));
  app.route('/api/projects')
    //.all(auth.requiresLogin, permission.echo)
    .post(project.create, updates.created)
    .get(project.all, star.isStarred);
  app.route('/api/projects/:id([0-9a-fA-F]{24})')
    .get(project.read, star.isStarred)
    .put(project.read, project.update, star.isStarred)
    .delete(project.destroy);
  app.route('/api/history/projects/:id([0-9a-fA-F]{24})')
    .get(project.readHistory);
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/projects')
    .get(project.getByDiscussion, project.getByEntity);

  app.route('/api/tasks*').all(entity('tasks'));
  app.route('/api/tasks')
    .post(task.create, updates.created)
    .get(pagination.parseParams, task.all, star.isStarred, pagination.formResponse);
  app.route('/api/tasks/tags')
    .get(task.tagsList);
  app.route('/api/tasks/zombie')
    .get(task.getZombieTasks, star.isStarred);
  app.route('/api/tasks/:id([0-9a-fA-F]{24})')
    .get(task.read, star.isStarred)
    .put(task.read, task.update, star.isStarred, updates.updated)
    .delete(task.destroy);

  app.route('/api/:entity(discussions|projects|users)/:id([0-9a-fA-F]{24})/tasks')
    .get(task.getByEntity);
  app.route('/api/history/tasks/:id([0-9a-fA-F]{24})')
    .get(task.readHistory);

  app.route('/api/comments/*').all(entity('comments'));
  app.route('/api/comments')
    .post(comment.create)
    .get(comment.all);
  app.route('/api/comments/:id([0-9a-fA-F]{24})')
    .get(comment.read)
    .put(comment.update)
    .delete(comment.destroy);
  app.route('/api/history/comments/:id([0-9a-fA-F]{24})')
    .get(comment.readHistory);

  app.route('/api/avatar')
    .post(profile.profile, profile.uploadAvatar, profile.update);

  app.route('/api/users*').all(entity('users'));
  app.route('/api/users')
    .post(users.filterProperties, users.create)
    .get(users.all);
  app.route('/api/users/:id([0-9a-fA-F]{24})')
    .get(users.read)
    .put(users.filterProperties, users.update)
    .delete(users.destroy);
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/users')
    .get(users.getByEntity);

  app.route('/api/attachments*').all(entity('attachments'));
  app.route('/api/attachments')
    .post(attachments.upload, attachments.create)
    .get(attachments.all);
  app.route('/api/attachments/:id([0-9a-fA-F]{24})')
    .get(attachments.read)
    .post(attachments.read, attachments.upload, attachments.update);
  app.route('/api/history/attachments/:id([0-9a-fA-F]{24})')
    .get(attachments.readHistory);
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/attachments')
    .get(attachments.getByEntity);

  app.route('/api/search')
    .get(elasticsearch.search);

  app.route('/api/discussions*').all(entity('discussions'));
  app.route('/api/discussions')
    .post(discussion.create, updates.created)
    .get(discussion.all, star.isStarred);
  app.route('/api/history/discussions/:id([0-9a-fA-F]{24})')
    .get(discussion.readHistory);
  app.route('/api/discussions/:id([0-9a-fA-F]{24})')
    .get(discussion.read, star.isStarred)
    .put(discussion.read, discussion.update, star.isStarred, updates.updated)
    .delete(discussion.destroy);
  app.route('/api/discussions/:id([0-9a-fA-F]{24})/schedule')
    .post(discussion.read, discussion.schedule, discussion.update, updates.updated);
  app.route('/api/discussions/:id([0-9a-fA-F]{24})/summary')
    .post(discussion.read, discussion.summary, discussion.update, updates.updated);
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/discussions')
    .get(discussion.getByProject, star.isStarred); //, discussion.getByEntity);

  app.route('/api/updates*').all(entity('updates'));
  app.route('/api/updates')
    .post(updates.create)
    .get(updates.all, updates.getAttachmentsForUpdate);
  app.route('/api/updates/:id([0-9a-fA-F]{24})')
    .get(updates.read, updates.getAttachmentsForUpdate)
    .put(updates.update);
  //     // .delete(updates.destroy);
  app.route('/api/:entity(tasks|discussions|projects)/:id([0-9a-fA-F]{24})/updates')
    .get(updates.getByEntity, updates.getAttachmentsForUpdate);
  app.route('/api/history/updates/:id([0-9a-fA-F]{24})')
    .get(updates.readHistory);

  //temporary -because of swagger bug with 'tasks' word

  app.route('/api/task/tags')
    .get(task.tagsList);
  app.route('/api/task/zombie')
    .get(task.getZombieTasks);
  app.route('/api/task/:id([0-9a-fA-F]{24})')
    .get(task.read)
    .put(task.update)
    .delete(task.destroy);

  app.route('/api/*').all(response);
  app.route('/api/*').all(error);

  //app.use(utils.errorHandler);
};
