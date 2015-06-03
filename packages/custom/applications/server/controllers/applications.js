'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Application = mongoose.model('Application'),
    _ = require('lodash'),
    async = require('async');
/**
 * Find application by id
 */
exports.application = function(req, res, next, id) {
    Application.load(id, function(err, application) {
        if (err) return next(err);
        if (!application) return next(new Error('Failed to load application ' + id));
        req.application = application;
        next();
    });
};

/**
 * Create an application
 */
exports.create = function(req, res, next) {
    var application = new Application(req.body);

    application.save(function(err) {
        if (err) {
            return res.status(500).json({
                error: 'Cannot save the application'
            });
        }
        req.application = application;
        next(req, res);
    });
};

/**
 * Update an application
 */
exports.update = function(req, res) {
    var application = req.application;

    application = _.extend(application, req.body);

    application.save(function(err) {
        if (err) {
            return res.status(500).json({
                error: 'Cannot update the application'
            });
        }
        res.json(application);

    });
};

/**
 * Delete an application
 */
exports.destroy = function(req, res) {
    var application = req.application;

    application.remove(function(err) {
        if (err) {
            return res.status(500).json({
                error: 'Cannot delete the application'
            });
        }
        res.json(application);

    });
};

/**
 * Show an application
 */
exports.show = function(req, res) {
    res.json(req.application);
};

/**
 * List of Applications
 */
exports.all = function(req, res) {
    Application.find().sort('-created').exec(function(err, applications) {
        if (err) {
            return res.status(500).json({
                error: 'Cannot list the applications'
            });
        }
        res.json(applications);

    });
};
