'use strict';

angular.module('mean.notifications').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('notifications example page', {
      url: '/notifications/example',
      templateUrl: 'notifications/views/index.html'
    });
  }
]);
