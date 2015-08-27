'use strict';

var utils = require('./utils');

var mongoose = require('mongoose'),
	ObjectId = require('mongoose').Types.ObjectId;

require('../models/attachment');
var Attachment = mongoose.model('Attachment'),
	AttachmentArchive = mongoose.model('attachment_archive'),
	elasticsearch = require('./elasticsearch'),
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

    Attachment.findById(req.params.id)
      .populate('creator')
      .populate('updater')
      .populate('issueId', null, attachment.issue.charAt(0).toUpperCase() + attachment.issue.slice(1))
      .exec(function (err, attachment) {
        utils.checkAndHandleError(err, res, 'Failed to read attachment');
        res.status(200);
        return res.json(attachment);
      });
	});

};

exports.query = function(req, res) {
	var query = {};
	if (!(_.isEmpty(req.query))) {
		query = elasticsearch.advancedSearch(req.query);
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

var saveAttachment = function(data, user, discussion, cb) {
	new Attachment(data).save({
		user: user,
		discussion: discussion
	}, function(err, attachment) {
		cb(attachment)
	});
};

exports.create = function(req, res, next) {
	var attachments = req.data.attachments;
	var c = 0;
	var savedAttachments = [];

	req.data.created = new Date();
	req.data.updated = new Date();
	req.data.creator = req.user._id;

	for (var i = 0; i < attachments.length; i++) {
		req.data.name = attachments[i].name;
		req.data.path = attachments[i].path;
		req.data.attachmentType = path.extname(attachments[i].path).substr(1).toLowerCase();

		saveAttachment(req.data, req.user, req.body.discussion, function(attachment) {
			c++;
			savedAttachments.push(attachment);
			if (c === attachments.length) {
				res.status(200);
				return res.json(savedAttachments);
			}
		})
	}
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
		attachment.attachmentType = path.extname(req.data.path).substr(1).toLowerCase();
		attachment.name = req.data.name;

		attachment.save({
			user: req.user,
			discussion: req.body.discussion
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
			'c._id': new ObjectId(req.params.id)
		});
		Query.populate('u');
		Query.populate('d');
		Query.exec(function(err, attachments) {
			utils.checkAndHandleError(err, res, 'Failed to read history for attachment: ' + req.params.id);

			res.status(200);
			return res.json(attachments);
		});
	} else {
		utils.checkAndHandleError(true, res, 'Failed to read history for attachment ' + req.params.id);
	}
};

exports.getByEntity = function(req, res) {
	var entities = {projects : 'project',  tasks: 'task', discussions: 'discussion'},
		entity = entities[req.params.entity],
		query = {
			query: {
				filtered: {
					filter : {
						terms: {}
					}
				}
			}
		};
	if (!(req.params.id instanceof Array)) req.params.id = [req.params.id];
	query.query.filtered.filter.terms[entity] =  req.params.id;

	mean.elasticsearch.search({index:'attachment','body': query, size:3000}, function(err,response) {
		if(err) {
			res.status(200).send([]);
		}
		else res.send(response.hits.hits.map(function(item) {return item._source}))
	});
};

exports.upload = function (req, res, next) {
	console.log('start upload...');
	Date.prototype.yyyymmdd = function () {
		var yyyy = this.getFullYear().toString();
		var mm = (this.getMonth() + 1).toString();
		var dd = this.getDate().toString();
		return yyyy + '/' + (mm[1] ? mm : '0' + mm[0]) + '/' + (dd[1] ? dd : '0' + dd[0]);
	};

	var d = new Date().yyyymmdd();

	req.data = {
		attachments: []
	};

	var busboy = new Busboy({
		headers: req.headers
	});

	busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
		var saveTo = path.join(config.attachmentDir, d, new Date().getTime() + '-' + path.basename(filename));
		var hostFileLocation = config.hostname + saveTo.substring(saveTo.indexOf('/files'));
		var fileType = path.extname(filename).substr(1).toLowerCase();

		mkdirp(path.join(config.attachmentDir, d), function (err) {
			console.log('err: ', err);
			file.pipe(fs.createWriteStream(saveTo));
		});
		req.data.attachments.push({
			name: filename,
			path: hostFileLocation,
			attachmentType: fileType
		});
		req.file = true;
	});

	busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
		req.data[fieldname] = val;
	});

	busboy.on('finish', function () {
		console.log('finish', req.file);
		if (req.file)
			next();
		else
			utils.checkAndHandleError(true, res, 'Didn\'t find any attachment to upload');
	});
	return req.pipe(busboy);

};