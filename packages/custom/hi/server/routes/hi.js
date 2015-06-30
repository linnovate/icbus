'use strict';

var notifications = require('../controllers/notifications'),
    rooms = require('../controllers/rooms'),
    applicationProvider = require('../../../applications/server/providers/applications'),
    elasticsearch = require('../../../icapi/server/controllers/elasticsearch');

module.exports = function(Notifications, app, auth, database) {
    app.post('/api/notifications/:appName/:token/:room/:text', applicationProvider.checkApp, notifications.send);
    app.post('/api/rooms',applicationProvider.checkApp, rooms.create);
    app.get('/api/rooms', rooms.all);
    app.get('/api/search', elasticsearch.search);
};
