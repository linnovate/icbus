'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('lodash'),
    Busboy = require('busboy'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    config = require('meanio').loadConfig();

/**
 * Find profile by user id
 */
exports.profile = function(req, res, next) {
    User.findOne({
        _id: req.user._id
    }).exec(function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load user ' + id));
        req.profile = user.profile;
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
        utils.checkAndHandleError(err, res, 'Cannot update the profile');
        res.json(user.profile);
    });
};

/**
 * Update user avatar
 */
exports.uploadAvatar = function(req, res, next) {
    var busboy = new Busboy({
        headers: req.headers
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (!req.user) {
            utils.checkAndHandleError(true, res, 'User not found');
        }
        var saveTo = config.root + '/packages/core/users/public/assets/img/avatar/' + req.user._id + '.' + path.basename(filename.split('.').slice(-1)[0]).toLowerCase();

        file.pipe(fs.createWriteStream(saveTo));
        req.body.avatar = config.hostname + '/users/assets/img/avatar/' + req.user._id + '.' + path.basename(filename.split('.').slice(-1)[0]).toLowerCase();
        req.file = true;
    });
    busboy.on('finish', function() {
        if (req.file)
            next();
        else
            utils.checkAndHandleError('Didn\'t find any avatar to upload', res, 'Didn\'t find any avatar to upload');
    });
    return req.pipe(busboy);

};