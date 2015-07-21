'use strict';

var dateFormat = function(date) {
  return ('3:07 PM on July 16, 2015');
};

module.exports = {
  comment_email: function(user, text, from, task, icu, mailOptions) {
    mailOptions.html = [
      '<div style="display:block;margin:0 auto;max-width:580px;padding:12px 16px;background-color:orange">',
      '<div style="margin:0 auto;max-height:37px;max-width:122px;text-align: center;">ICU</div></div>',
      '<div style="display:block;margin:0 auto;max-width:580px;padding:12px 16px;background-color:#FCFBF6">',
      '<h2>Here’s what you missed…</h2>',
      // '<img style="appearance: none;border: none;height: calc(30px * 2);border-radius: 30px;width: calc(30px * 2);background-color: #b8e77f;width: 45px;height: 44px;margin: 0 7.5px;" src="'+from.profile.avatar+'"/>',
      '<img style="appearance: none;border: none;height: calc(30px * 2);border-radius: 30px;width: calc(30px * 2);background-color: #b8e77f;width: 45px;height: 44px;margin: 0 7.5px;"/>',
      '<strong>' + from.name + '</strong> commented on task ',
      '<a href="' + icu + '/' + 'tasks/by-project/' + task.project._id + '/' + task._id+ '/activities">' + task.title + '</a>',
      ' on ',
      '<a href="' + icu + '/' + 'tasks/by-project/' + task.project._id + '">' + task.project.title + '</a>',
      '<div style="background-color:#fff;border:1px solid #dbdbdb;border-radius:3px;display:block;margin:6px 60px;padding:10px 12px">' + text + '</div>'
    ].join('\n\n');
    mailOptions.subject = from.name + ' mentioned you on the task ' + task.title + ' on ' + task.project.title + ' at ' + dateFormat(0);
    mailOptions.forceEmbeddedImages = true;
    return mailOptions;
  }
};