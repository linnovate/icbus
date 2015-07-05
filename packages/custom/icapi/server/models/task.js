'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  archive = require('./archive.js');


var TaskSchema = new Schema({
  created: {
    type: Date
  },
  updated: {
    type: Date
  },  
  title: {
    type: String,
    required: true    
  },
  project : {
    type: Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  parent : {
    type: Schema.ObjectId,
    ref: 'Task'
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Received', 'Completed']
  },
  due: {
    type: Date,
  },
  //should we maybe have finer grain control on this
  watchers : [{
    type: Schema.ObjectId,
    ref: 'User'
  }]
});

/**
 * Validations
 */
TaskSchema.path('title').validate(function(title) {
  return !!title;
}, 'Title cannot be blank');

/**
 * Statics
 */
TaskSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('creator', 'name username').exec(cb);
};
TaskSchema.statics.project = function(id, cb){
  require('./project');
  var Project = mongoose.model('Project');
  Project.findById(id,  function(err, project){
    cb(project);
  })
};
/**
 * Post middleware
 */
var elasticsearch  = require('../controllers/elasticsearch');
TaskSchema.post('save', function (req, next) {
  var task = this;
  TaskSchema.statics.project(this.project, function(project) {
    elasticsearch.save(task, 'task', project.room);
  });
  next();
});

TaskSchema.pre('remove', function (next) {
  var task = this;
  TaskSchema.statics.project(this.project, function(project) {
    elasticsearch.delete(task, 'task', project.room, next);
  });
  next();
});

TaskSchema.plugin(archive);

mongoose.model('Tasks', TaskSchema);