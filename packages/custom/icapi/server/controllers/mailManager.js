'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	config = require('meanio').loadConfig(),
	templates = require('../template'),
	nodemailer = require('nodemailer');


function sendMail(mailOptions) {
	var transport = nodemailer.createTransport(config.mailer);
	transport.sendMail(mailOptions, function(err, response) {
		console.log(err, response);
		if (err) return err;
		return response;
	});
}

exports.send = function(doc, task) {
	var arr = doc.text.match(/@([^ :]*)*/g);
	arr = arr.map(function(item) {
		return item.slice(1)
	});
	User.findOne({
		_id: doc.creator
	}).exec(function(err, from) {
		User.find({
			username: {
				$in: arr
			}
		}).exec(function(err, users) {

			for (var i = 0; i < users.length; i++) {
				var user = users[i];
				var mailOptions = {
					to: user.email,
					from: config.emailFrom
				};
				mailOptions = templates.comment_email(user, doc.text, from, task, config.icu.uri, mailOptions);
				sendMail(mailOptions);
			}
		});
	});
};