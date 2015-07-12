'use strict';
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var am = {};

am.archiveModels = {};

am.archiveCollectionName = function(collectionName) {
  return collectionName + '_archive';
}

am.ArchiveModel = function(collectionName, name) {

  if (!(collectionName in am.archiveModels)) {
    var schema = new Schema({
      t: {
        type: Date,
        required: true
      },
      o: {
        type: String,
        required: true
      },
      d: {
        type: Schema.Types.Mixed,
        required: true
      },
      u: {
        type: Schema.ObjectId,
        ref: 'User'
      }
    }, {
      id: true,
      versionKey: false
    });

    am.archiveModels[collectionName] = mongoose.model(collectionName, schema, collectionName);

  }

  return am.archiveModels[collectionName];
};



module.exports = function archivePlugin(schema, collectionName) {

  // Clear all archive collection from Schema
  schema.statics.archiveModel = function() {
    return am.ArchiveModel(am.archiveCollectionName(collectionName));
  };

  // Clear all archive documents from archive collection
  schema.statics.clearArchive = function(callback) {
    var Archive = am.ArchiveModel(am.archiveCollectionName(collectionName));
    Archive.remove({}, function(err) {
      callback(err);
    });
  };

  am.ArchiveModel(am.archiveCollectionName(collectionName));

  // Create a copy when insert or update
  schema.pre('save', function(next, req, callback) {
    var d = this.toObject();
    d.__v = undefined;

    var archiveDoc = {};
    archiveDoc['t'] = new Date();
    archiveDoc['o'] = this.isNew ? 'i' : 'u';
    archiveDoc['d'] = d;
    archiveDoc['u'] = req.user;

    var archive = new am.ArchiveModel(am.archiveCollectionName(collectionName))(archiveDoc);
    archive.save(next);
    next(callback);
  });

  // Create a copy when remove
  schema.pre('remove', function(next, req, callback) {
    var d = this.toObject();
    d.__v = undefined;

    var archiveDoc = {};
    archiveDoc['t'] = new Date();
    archiveDoc['o'] = 'r';
    archiveDoc['d'] = d;
    archiveDoc['u'] = req.user;

    var archive = new am.ArchiveModel(am.archiveCollectionName(collectionName))(archiveDoc);
    archive.save(next);
    next(callback);
  });
};