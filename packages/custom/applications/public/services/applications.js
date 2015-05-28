'use strict';
function Applications($resource) {
  return $resource('api/applications/:applicationId', {
    applicationId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });
}
angular.module('mean.applications').factory('Applications', Applications);
Applications.$inject = ['$resource'];
