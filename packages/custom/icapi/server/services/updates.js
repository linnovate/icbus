'use strict';
require('../models/update');

var mongoose = require('mongoose'),
  Update = mongoose.model('Update');

exports.create = function (update, cb) {
  new Update(update).save(cb);
};
