'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  archive = require('./archive.js');


var ProjectSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },  
  title: {
    type: String,
    required: true,
    default: 'New Project'
  },
  parent : {
    type: Schema.ObjectId,
    ref: 'Project'
  },
  discussion : {
    type: Schema.ObjectId,
    ref: 'Discussion'
  },  
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  signature : {
    circles : {},
    codes: {}
  },
  color: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Archived', 'Cancelled', 'In-Progress', 'Completed'],
    default: 'New'
  },
  description: {
    type: String
  },
  //should we maybe have finer grain control on this
  watchers : [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  room: {
    type: String
  }
});

/**
 * Validations
 */
ProjectSchema.path('title').validate(function(title) {
  return !!title;
}, 'Title cannot be blank');

/**
 * Statics
 */
ProjectSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('creator', 'name username').exec(cb);
};

/**
 * Post middleware
 */
var elasticsearch  = require('../controllers/elasticsearch');

ProjectSchema.post('save', function (req, next) {
  elasticsearch.save(this, 'project', this.room);
  next();
});

ProjectSchema.pre('remove', function (next) {
  elasticsearch.delete(this, 'project',this.room, next);
  next();
});

ProjectSchema.plugin(archive, 'project');

mongoose.model('Project', ProjectSchema);
