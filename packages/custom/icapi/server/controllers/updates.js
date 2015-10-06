'use strict';

var utils = require('./utils');

var mongoose = require('mongoose'),
  ObjectId = require('mongoose').Types.ObjectId;

var updateService = require('../services/updates.js');

require('../models/update');
var Update = mongoose.model('Update'),
  UpdateArchive = mongoose.model('update_archive'),
  elasticsearch = require('./elasticsearch'),
  mean = require('meanio'),
  _ = require('lodash');

var getAttachmentsForUpdate = function (item, query, cb) {
  query.query.filtered.filter.term.issue = 'update';
  query.query.filtered.filter.term.issueId = item._id;
  mean.elasticsearch.search({index: 'attachment', 'body': query, size: 3000}, function (err, response) {
    item.attachments = [];

    if (!err) {
      item.attachments = response.hits.hits.map(function (attachment) {
        return attachment._source;
      });
    }

    cb(item);
  });
};

exports.read = function (req, res, next) {
  Update.findOne({
    _id: req.params.id
  }, {
    issue: 1,
    issueId: 1
  }).exec(function (err, update) {
    utils.checkAndHandleError(err, 'Failed to read update', next);

    Update.findById(req.params.id)
      .exec(function (err, update) {
        utils.checkAndHandleError(err, 'Failed to read update', next);

        var query = {
          query: {
            filtered: {
              filter: {
                term: {}
              }
            }
          }
        };

        update = JSON.parse(JSON.stringify(update));

        getAttachmentsForUpdate(update, query, function (updateWithAttachments) {
          res.status(200);
          return res.json(updateWithAttachments);
        });
      });
  });

};

exports.all = function (req, res, next) {
  var query = {};
  if (!(_.isEmpty(req.query))) {
    query = elasticsearch.advancedSearch(req.query);
  }

  mean.elasticsearch.search({
    index: 'update',
    body: query
  }, function (err, response) {
    utils.checkAndHandleError(err, 'Failed to find updates', next);

    res.send(response.hits.hits.map(function (item) {
      return item._source
    }))
  });
};

exports.getByEntity = function (req, res, next) {
  var entities = {projects: 'project', users: 'assign', tasks: 'task', discussions: 'discussion'},
    entity = entities[req.params.entity],
    query = {
      query: {
        filtered: {
          filter: {
            term: {
              issue: entity,
              issueId: req.params.id
            }
          }
        }
      }
    };

  mean.elasticsearch.search({index: 'update', 'body': query, size: 3000}, function (err, response) {
    utils.checkAndHandleError(err, 'Failed to find entities', next);

    var items = [],
      length = response.hits.hits.length;
    if (length === 0) {
      res.status(200);
      return res.json([]);
    }

    function attachmentCb(item) {
      items.push(item);
      if (items.length === length) res.send(items);
    }

    for (var i = 0; i < response.hits.hits.length; i += 1) {
      getAttachmentsForUpdate(response.hits.hits[i]._source, query, attachmentCb);
    }
  })
};

exports.create = function (req, res, next) {
  req.body.created = new Date();
  req.body.updated = new Date();
  req.body.creator = req.user._id;

  new Update(req.body).save({ user: req.user, discussion: req.discussion }, function (err, update) {
    utils.checkAndHandleError(err, 'Failed to save update', next);

    res.status(200);
    return res.json(update);
  });
};

exports.update = function (req, res, next) {
  if (!req.params.id) {
    return res.send(404, 'Cannot update update without an id');
  }

  Update.findById(req.params.id, function (err, update) {
    utils.checkAndHandleError(err, 'Failed to find update: ' + req.params.id, next);

    update.updated = new Date();
    update.updater = req.user._id;
    update.path = req.data.path;
    update.name = req.data.name;
    update.description = req.data.desciption;

    update.save({
      user: req.user,
      discussion: req.body.discussion
    }, function (err, update) {
      utils.checkAndHandleError(err, 'Failed to update update: ' + req.params.id, next);

      res.status(200);
      return res.json(update);
    });
  });

};

exports.created = function(req, res, next) {
  if (req.locals.error) {
    return next();
  }

  var entityName = req.params.entity || req.locals.data.entityName;
  var entityService = updateService(entityName, { user: req.user });

  entityService.created(req.locals.result._id).then(function() {
    next();
  });
};

exports.updated = function(req, res, next) {
  if (req.locals.error || !req.locals.data.shouldCreateUpdate) {
    return next();
  }

  var entityName = req.params.entity || req.locals.data.entityName;
  var entityService = updateService(entityName, { user: req.user });

  entityService.updated(req.locals.result._id).then(function() {
    next();
  });
};

exports.readHistory = function (req, res, next) {
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    var Query = UpdateArchive.find({
      'c._id': new ObjectId(req.params.id)
    });
    Query.populate('u');
    Query.populate('d');
    Query.exec(function (err, updates) {
      utils.checkAndHandleError(err, 'Failed to read history for update: ' + req.params.id, next);

      res.status(200);
      return res.json(updates);
    });
  } else {
    utils.checkAndHandleError(true, 'Failed to read history for update ' + req.params.id, next);
  }
};
