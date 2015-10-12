'use strict';

var _ = require('lodash');
var q = require('q');

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

var AttachementModel = require('../models/attachment.js');
var AttachementArchiveModel = mongoose.model('attachment_archive');

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
  },
  'attachments': {
    mainModel: AttachementModel,
    archiveModel: AttachementArchiveModel
  }

};

var defaults = {
  defaults: {},
  includes: ''
};

module.exports = function(entityName, options) {
  var Model = entityNameMap[entityName].mainModel;
  var ArchiveModel = entityNameMap[entityName].archiveModel;

  if (_.isEmpty(options)) {
    options = {};
  }

  options = _.defaults(options, defaults);

  function all(pagination) {
    var deffered = q.defer();

    var query;
    var countQuery = Model.find({}).count();
    var mergedPromise;

    if (pagination && pagination.type) {
      if (pagination.type === 'page') {
        query = Model.find({}).skip(pagination.start).limit(pagination.limit);
        mergedPromise = q.all([query, countQuery]).then(function(results) {
          pagination.count = results[1];
          return results[0];
        });

        deffered.resolve(mergedPromise);
      } else {
        var promises;
        if (!pagination.skip) {
          var prevPageQuery = Model.find({ _id: { $gte: pagination.id } })
            .skip(pagination.skip * pagination.limit)
            .limit(pagination.limit);

          var nextPageQuery = Model.find({ _id: { $lt: pagination.id } })
            .skip(pagination.skip * pagination.limit)
            .limit(pagination.limit);

          promises = [prevPageQuery, nextPageQuery, countQuery];
        } else {
          var predicate = { _id: { $gte: pagination.id }};

          if (pagination.skip > 0) {
            predicate = { _id: { $lt: pagination.id }};
          }

          var pageQuery = Model.find(predicate)
            .skip(pagination.skip * pagination.limit)
            .limit(pagination.limit);

          promises = [pageQuery, countQuery];
        }

        mergedPromise = q.all(promises).then(function(results) {
          pagination.count = results[2];
          return results[0].concat(results[1]);
        });

        deffered.resolve(mergedPromise);
      }
    } else {
      query = Model.find({});
      deffered.resolve(query);
    }

    deffered.promise.then(function(query) {
      query.populate(options.includes);
      query.hint({ _id: 1 });

      return query.exec();
    });

    return deffered.promise;
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
    entity.creator = user.user._id;

    return new Model(entity).save(user).then(function(e) {
      return Model.populate(e, options.includes);
    });
  }

  function update(oldE, newE, user) {
    var entityWithDefaults = _.defaults(newE, options.defaults);
    oldE = _.extend(oldE, entityWithDefaults);

    oldE.updated = new Date();
    oldE.updater = user.user._id;

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
    destroy: destroy
  };

  if (ArchiveModel) {
    methods.readHistory = readHistory;
  }

  return methods;
};
