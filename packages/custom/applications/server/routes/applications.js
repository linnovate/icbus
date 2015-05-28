'use strict';

 var applications = require('../controllers/applications');

 module.exports = function(Articles, app, auth) {

 app.route('/api/applications')
 .get(applications.all)
 .post(auth.requiresLogin, applications.create);
 app.route('/api/applications/:applicationId')
 .get(auth.isMongoId, applications.show)
 .put(auth.isMongoId, auth.requiresLogin, applications.update)
 .delete(auth.isMongoId, auth.requiresLogin, applications.destroy);

 // Finish with setting up the applicationId param
 app.param('applicationId', applications.application);
 };
