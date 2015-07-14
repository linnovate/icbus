'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	archive = require('./archive.js');


var AttachmentSchema = new Schema({
	created: {
		type: Date
	},
	updated: {
		type: Date
	},
	name: {
		type: String,
		required: true
	},
	path: {
		type: String,
		required: true
	},
	issue: {
		type: String,
		required: true
	},
	issueId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	creator: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	updater: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	room: {
		type: String
	}
});

/**
 * Validations
 */
AttachmentSchema.path('name').validate(function(name) {
	return !!name;
}, 'Name cannot be blank');

/**
 * Statics
 */
AttachmentSchema.statics.load = function(id, cb) {
	this.findOne({
		_id: id
	}).populate('creator', 'name username').exec(cb);
};

/**
 * Post middleware
 */
var elasticsearch = require('../controllers/elasticsearch');

AttachmentSchema.post('save', function(req, next) {
	elasticsearch.save(this, 'attachment', this.room);
	next();
});

AttachmentSchema.pre('remove', function(next) {
	elasticsearch.delete(this, 'attachment', this.room, next);
	next();
});

AttachmentSchema.plugin(archive, 'attachment');

mongoose.model('Attachment', AttachmentSchema);