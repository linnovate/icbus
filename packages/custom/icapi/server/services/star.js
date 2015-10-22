'use strict';

var _ = require('lodash');

var UserModel = require('../models/user.js');
var TaskModel = require('../models/task.js');
var ProjectModel = require('../models/project.js');
var DiscussionModel = require('../models/discussion.js');
var UpdateModel = require('../models/update.js');

var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

var entityNameMap = {
  'tasks': TaskModel,
  'projects': ProjectModel,
  'discussions': DiscussionModel,
  'updates': UpdateModel
};

module.exports = function(entityName, options) {
  function starEntity(id, value) {
    var starredEntities = 'starred' + capitalize(entityName);

    var starred = false;
    return UserModel.findById(options.user._id).then(function(user) {
      var query;

      var profileProperty = 'profile.' + starredEntities;
      var hasNoProfile = !user.profile || !user.profile[starredEntities];

      if (hasNoProfile && (value === 'toggle' || value === 'star')) {
        query = {};
        query[profileProperty] = [id];
      } else if (!hasNoProfile) {
        var starFound = user.profile[starredEntities].indexOf(id) > -1;
        if (starFound && (value === 'toggle' || value === 'unstar')) {
          query = { $pull: {} };
          query.$pull[profileProperty] = id;
        } else if (!starFound && (value === 'toggle' || value === 'star')) {
          query = { $push: {} };
          query.$push[profileProperty] = id;

          starred = true;
        }
      }

      if (!query) {
        return starred;
      } else {
        return user.update(query).then(function() {
          return starred;
        });
      }
    });
  }

  function getStarred() {
    var Model = entityNameMap[entityName];

    var query = UserModel.findOne({
      _id: options.user._id
    });

    return query.then(function(user) {
      var starredEntities = 'starred' + capitalize(entityName);

      if (!user.profile || !user.profile[starredEntities] || user.profile[starredEntities].length === 0) {
        return [];
      } else {
        return Model.find({
          '_id': {
            $in: user.profile[starredEntities]
          }
        });
      }
    });
  }

  function isStarred(data) {
    return getStarred().then(function(starred) {
      if (!_.isArray(data)) {
        data = [data];
      }

      var ids = _(data).reduce(function(memo, item) {
        var id = item._id.toString();
        memo.push(id);

        return memo;
      }, []);

      starred = _(starred).reduce(function(memo, item) {
        var id = item._id.toString();
        memo.push(id);

        return memo;
      }, []);

      var matches = _.intersection(starred, ids);


      data.forEach(function(d) {
        d.star = _(matches).any(function(m) {
          return d._id.toString() === m;
        });
      });
    });
  }

  return {
    starEntity: starEntity,
    getStarred: getStarred,
    isStarred: isStarred
  };
};
