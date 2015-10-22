'use strict';

var hi = require('../controllers/hi'),
    applicationProvider = require('../../../applications/server/providers/applications');

module.exports = function(Hi, app, auth) {

    //app.get('/api/search', elasticsearch.search);

    app.route('/api/hi/rooms')
        .post(applicationProvider.checkApp, hi.proxy)
        .get(applicationProvider.checkApp, hi.proxy);

    app.route('/api/hi/rooms/:id')
        //.get(applicationProvider.checkApp, hi.proxy)
        .put(applicationProvider.checkApp, hi.proxy)
        .delete(applicationProvider.checkApp, hi.proxy);

    app.route('/api/hi/rooms/:id/:owner')
        .get(applicationProvider.checkApp, hi.proxy);

    app.route('/api/hi/messages')
        .post(applicationProvider.checkApp, hi.proxy);

    app.route('/api/hi/files')
        .post(applicationProvider.checkApp, hi.proxy);

    app.route('/api/hi/users')
        .post(applicationProvider.checkApp, hi.proxy);
};
