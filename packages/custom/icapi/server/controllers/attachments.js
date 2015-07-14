'use strict';

var utils = require('./utils');

var mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId;

require('../models/attachment');
var Attachment = mongoose.model('Attachment'),
	AttachmentArchive = mongoose.model('attachment_archive'),
	mean = require('meanio'),
	_ = require('lodash'),
	path = require('path'),
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	config = require('meanio').loadConfig(),
	Busboy = require('busboy');

exports.read = function(req, res, next) {
	Attachment.findOne({
		_id: req.params.id
	}, {
		issue: 1,
		issueId: 1
	}).exec(function(err, attachment) {
		utils.checkAndHandleError(err, res, 'Failed to read attachment');

		Attachment.findById(req.params.id).populate('creator').populate('updater').populate('issueId', null, attachment.issue.charAt(0).toUpperCase() + attachment.issue.slice(1)).exec(function(err, attachment) {
			utils.checkAndHandleError(err, res, 'Failed to read attachment');
			res.status(200);
			return res.json(attachment);
		});
	});

};

exports.query = function(req, res) {
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = advancedSearch(req.query);
	}

	mean.elasticsearch.search({
		index: 'attachment',
		'body': query
	}, function(err, response) {
		if (err)
			res.status(500).send('Failed to find attachments');
		else
			res.send(response.hits.hits.map(function(item) {
				return item._source
			}))
	});
};

function advancedSearch(query) {
	var queries = [],
		jsonQuery;
	for (var i in query) {
		var isArray = query[i].indexOf(',') > -1;
		if (isArray) {
			var terms = query[i].split(',');
			jsonQuery = {
				terms: {
					minimum_should_match: terms.length
				}
			};
			jsonQuery.terms[i] = terms;
			queries.push(jsonQuery);
		} else {
			jsonQuery = {
				term: {}
			};
			jsonQuery.term[i] = query[i];
			queries.push(jsonQuery);
		}
	}
	return {
		query: {
			filtered: {
				query: {
					bool: {
						must: queries
					}
				}
			}
		}
	}
};

exports.create = function(req, res, next) {

	req.data.created = new Date();
	req.data.updated = new Date();
	req.data.creator = req.user._id;

	new Attachment(req.data).save({
		user: req.user
	}, function(err, attachment) {
		utils.checkAndHandleError(err, res, 'Failed to save attachment');
		res.status(200);
		return res.json(attachment);
	});
};

exports.update = function(req, res, next) {

	if (!req.params.id) {
		return res.send(404, 'Cannot update attachment without an id');
	}
	Attachment.findById(req.params.id, function(err, attachment) {
		utils.checkAndHandleError(err, res);
		attachment.updated = new Date();
		attachment.updater = req.user._id;
		attachment.path = req.data.path;
		attachment.name = req.data.name;

		attachment.save({
			user: req.user
		}, function(err, attachment) {
			utils.checkAndHandleError(err, res, 'Failed to update attachment: ' + req.params.id);
			res.status(200);
			return res.json(attachment);
		});
	});

};

exports.readHistory = function(req, res, next) {
	if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
		var Query = AttachmentArchive.find({
			'd._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.exec(function(err, attachments) {
			utils.checkAndHandleError(err, res, 'Failed to read history for attachment: ' + req.params.id);

			res.status(200);
			return res.json(attachments);
		});
	} else
		utils.checkAndHandleError(req.params.id + ' is not a mongoose ObjectId', res, 'Failed to read history for attachment ' + req.params.id);
};

exports.upload = function(req, res, next) {

	Date.prototype.yyyymmdd = function() {
		var yyyy = this.getFullYear().toString();
		var mm = (this.getMonth() + 1).toString();
		var dd = this.getDate().toString();
		return yyyy + '/' + (mm[1] ? mm : '0' + mm[0]) + '/' + (dd[1] ? dd : '0' + dd[0]);
	};

	var d = new Date().yyyymmdd();

	req.data = {};

	var busboy = new Busboy({
		headers: req.headers
	});
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		var saveTo = path.join(config.attachmentDir, d, new Date().getTime() + '-' + path.basename(filename));

		mkdirp(path.join(config.attachmentDir, d), function(err) {
			file.pipe(fs.createWriteStream(saveTo));
		});
		req.data.name = filename;
		req.data.path = saveTo;
		req.file = true;
	});
	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
		req.data[fieldname] = val;
	});
	busboy.on('finish', function() {
		if (req.file)
			next();
		else
			utils.checkAndHandleError('Didn\'t find any attachment to upload', res, 'Didn\'t find any attachment to upload');
	});
	return req.pipe(busboy);

};