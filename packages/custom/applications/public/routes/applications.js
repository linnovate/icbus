'use strict';

angular.module('mean.applications').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('applications example page', {
      url: '/applications/example',
      templateUrl: 'applications/views/index.html'
    });
  }
]);
