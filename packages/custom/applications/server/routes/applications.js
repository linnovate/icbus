'use strict';

 var applications = require('../controllers/applications');
 var rooms = require('../../../hi/server/controllers/rooms');

 module.exports = function(Applications, app, auth) {

 app.route('/api/applications')
 .get(applications.all)
 .post(auth.requiresLogin,function(req, res){
      console.log('applications.create')
      applications.create(req, res, rooms.create)
     } );
 app.route('/api/applications/:applicationId')
 .get(auth.isMongoId, applications.show)
 .put(auth.isMongoId, auth.requiresLogin, applications.update)
 .delete(auth.isMongoId, auth.requiresLogin, applications.destroy);

 // Finish with setting up the applicationId param
 app.param('applicationId', applications.application);
 };
