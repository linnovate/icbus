'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	User = mongoose.model('User'),
  _ = require('lodash'),
	config = require('meanio').loadConfig(),
	templates = require('../template'),
	nodemailer = require('nodemailer'),
  smtpTransport = require('nodemailer-smtp-transport');



function sendMail(mailOptions) {
  var options = config.mailer;

  if (config.mailer.service === 'SMTP') {
    options = smtpTransport(options);
  }

  var transport = nodemailer.createTransport(options);

	transport.sendMail(mailOptions, function(err, response) {
		console.log(err, response);
		if (err) return err;
		return response;
	});
}

//temporary function
//send should be deleted latter and use this function
//as sole interface to main manager
exports.sendEx = function(type, data) {
  if (type === 'comment_email') {
    //template format does not compatible yet
    //use send function
    return;
  }

  var template = templates[type];
  if (!template) {
    return;
  }

  data.uriRoot = config.icu.uri;

  var compiledSubject = _.template(template.subject);
  var subject = compiledSubject(data);

  var compiledBody = _.template(template.body);
  var body = compiledBody(data);

  data.discussion.watchers.forEach(function(watcher) {
    var mailOptions = {
      to: watcher.email,
      from: config.emailFrom,
      subject: subject,
      html: body,
      forceEmbeddedImages: true
    };

    sendMail(mailOptions);
  });
};

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
