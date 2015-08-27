'use strict';

var utils = require('./utils');


var mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId;

require('../models/comment');
var Comment = mongoose.model('Comment'),
	User = mongoose.model('User'),
	CommentArchive = mongoose.model('comment_archive'),
	mean = require('meanio'),
	_ = require('lodash'),
	elasticsearch = require('./elasticsearch');

exports.read = function(req, res, next) {
	Comment.findById(req.params.id).populate('assign').exec(function(err, comments) {
		utils.checkAndHandleError(err, res, 'Failed to read comment');
		res.status(200);
		return res.json(comments);
	});
};

exports.all = function(req, res) {
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = elasticsearch.advancedSearch(req.query);
	}

	mean.elasticsearch.search({
		index: 'comment',
		'body': query
	}, function(err, response) {
		if (err)
			res.status(500).send('Failed to found documents');
		else
			res.send(response.hits.hits.map(function(item) {
				return item._source
			}))
	});
};

exports.create = function(req, res, next) {
	var comment = {
		creator: req.user._id
	};
	comment = _.extend(comment, req.body);
	new Comment(comment).save({
		user: req.user,
		discussion: req.body.discussion
	}, function(err, comment) {
		utils.checkAndHandleError(err, res);
		res.status(200);
		return res.json(comment);
	});
};

exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update comment without id');
	}
	Comment.findById(req.params.id, function(err, comment) {
		if (err) utils.checkAndHandleError(err, res);
		else {
			if (!comment) utils.checkAndHandleError(true, res, 'Cannot find comment with id: ' + req.params.id);
			else {
				comment = _.extend(comment, req.body);
				comment.updated = new Date();
				comment.save({
					user: req.user,
					discussion: req.body.discussion
				}, function(err, comment) {
					utils.checkAndHandleError(err, res, 'Failed to update comment');
					res.status(200);
					return res.json(comment);
				});
			}
		}
	});
};

exports.destroy = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot destroy comment without id');
	}
	Comment.findById(req.params.id, function(err, comment) {
		if (err) utils.checkAndHandleError(err, res);
		else {
			if (!comment) utils.checkAndHandleError(true, res, 'Cannot find comment with id: ' + req.params.id);
			else
				comment.remove({
					user: req.user,
					discussion: req.body.discussion
				}, function(err, success) {
					utils.checkAndHandleError(err, res, 'Failed to destroy comment');
					res.status(200);
					return res.send({message: (success ? 'Comment deleted' : 'Failed to delete comment')});
				});
		}
	});
};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = CommentArchive.find({
			'c._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.populate('d');
		Query.exec(function(err, comments) {
			utils.checkAndHandleError(err, res, 'Failed to read history for comment ' + req.params.id);

			res.status(200);
			return res.json(comments);
		});
	} else
		utils.checkAndHandleError(req.params.id + ' is not a mongoose ObjectId', res, 'Failed to read history for comment ' + req.params.id);
};