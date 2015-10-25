'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Application Schema
 */
var ApplicationSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    iconPath: {
        type: String
    },
    token: {
        type: String,
        required: true
    },
    updated: {
        type: Array
    }
});

/**
 * Validations
 */
ApplicationSchema.path('name').validate(function(name) {
    return !!name;
}, 'Name cannot be blank');

ApplicationSchema.path('token').validate(function(token) {
    return !!token;
}, 'Token cannot be blank');

/**
 * Statics
 */
ApplicationSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).exec(cb);
};

mongoose.model('Application', ApplicationSchema);
