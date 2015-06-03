'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CircleSchema = new Schema({
  created: Date,
  updated: Date,
  category: String,
  name:  String,
  id: String,
  circle: {
    type: Schema.ObjectId,
    ref: 'Circle'
  },
});

mongoose.model('Circle', CircleSchema);
