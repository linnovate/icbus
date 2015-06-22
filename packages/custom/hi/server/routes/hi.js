'use strict';

var notifications = require('../controllers/notifications'),
    rooms = require('../controllers/rooms'),
    applicationProvider = require('../../../applications/server/providers/applications');

module.exports = function(Notifications, app, auth, database) {
    app.post('/api/notifications/:appName/:token/:room/:text', applicationProvider.checkApp, notifications.create);
    app.post('/api/rooms',applicationProvider.checkApp, rooms.create);
};
