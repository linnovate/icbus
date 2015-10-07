'use strict';

var _ = require('lodash');

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var TaskModel = require('../models/task.js');
var TaskArchiveModel = mongoose.model('task_archive');

var ProjectModel = require('../models/project.js');
var ProjectArchiveModel = mongoose.model('project_archive');

var DiscussionModel = require('../models/discussion.js');
var DiscussionArchiveModel = mongoose.model('discussion_archive');

var UpdateModel = require('../models/update.js');
var UpdateArchiveModel = mongoose.model('update_archive');

var UserModel = require('../models/user.js');

var entityNameMap = {
  'tasks': {
    mainModel: TaskModel,
    archiveModel: TaskArchiveModel
  },
  'projects': {
    mainModel: ProjectModel,
    archiveModel: ProjectArchiveModel
  },
  'discussions': {
    mainModel: DiscussionModel,
    archiveModel: DiscussionArchiveModel
  },
  'updates': {
    mainModel: UpdateModel,
    archiveModel: UpdateArchiveModel
  },
  'users': {
    mainModel: UserModel
  }
};

module.exports = function(entityName, options) {
  var Model = entityNameMap[entityName].mainModel;
  var ArchiveModel = entityNameMap[entityName].archiveModel;

  function all() {
    var query = Model.find({});

    query.populate(options.includes);

    return query.exec();
  }

  function read(id) {
    var query = Model.find({ _id: id });
    query.populate(options.includes);

    return query.then(function(results) {
      if (!results.length) {
        throw new Error('Entity not found');
      }

      return results[0];
    });
  }

  function create(entity, user) {
    entity.created = new Date();
    entity.updated = new Date();

    return new Model(entity).save(user).then(function(e) {
      return Model.populate(e, options.includes);
    });
  }

  function update(oldE, newE, user) {
    var entityWithDefaults = _.defaults(newE, options.defaults);
    oldE = _.extend(oldE, entityWithDefaults);

    oldE.updated = new Date();

    return oldE.save(user).then(function(data) {
      return Model.populate(data, options.includes);
    });
  }

  function destroy(id) {
    return Model.findOneAndRemove({
      _id: id
    }).exec();
  }

  function readHistory(id) {
    var Query = ArchiveModel.find({
      'c._id': new ObjectId(id)
    });

    Query.populate('u');
    Query.populate('d');

    return Query.exec();
  }

  var methods = {
    all: all,
    create: create,
    read: read,
    update: update,
    destroy: destroy,
  };

  if (ArchiveModel) {
    methods.readHistory = readHistory;
  }

  return methods;
}
