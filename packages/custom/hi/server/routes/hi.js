'use strict';

var notifications = require('../controllers/notifications'),
    rooms = require('../controllers/rooms'),
    applicationProvider = require('../../../applications/server/providers/applications');

module.exports = function(Notifications, app, auth, database) {
    app.post('/api/notifications/:appName/:token/:text', applicationProvider.checkApp, notifications.create, rooms.create);
    app.post('/api/rooms', rooms.create);
};
