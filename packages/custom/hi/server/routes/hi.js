'use strict';

var notifications = require('../controllers/notifications'),
    rooms = require('../controllers/rooms'),
    applicationProvider = require('../../../applications/server/providers/applications'),
    elasticsearch = require('../../../icapi/server/controllers/elasticsearch');

module.exports = function(Notifications, app, auth, database) {
    app.post('/api/notifications/:room', notifications.send);//applicationProvider.checkApp
    app.post('/api/rooms', rooms.create);//applicationProvider.checkApp,
    app.get('/api/rooms', rooms.all);
    app.get('/api/search', elasticsearch.search);
};
