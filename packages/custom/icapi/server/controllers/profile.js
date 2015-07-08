'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('lodash');

/**
 * Find profile by user id
 */
exports.profile = function(req, res, next) {
    User.findOne({
        _id: req.user._id
    }).exec(function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load user ' + id));
        req.profile = user;
        next();
    });
};
/**
 * Update user profile
 */
exports.update = function(req, res) {

    var user = _.extend(req.profile, {
        profile: req.body
    });
    user.save(function(err) {
        if (err) {
            return res.status(500).json({
                error: 'Cannot update the profile'
            });
        }
        res.json(user.profile);
    });
};
/**
 * Show user profile
 */
exports.show = function(req, res) {
    res.json(req.profile.profile);
};