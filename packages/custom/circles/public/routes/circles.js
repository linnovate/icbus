'use strict';

angular.module('mean.circles').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('circles example page', {
      url: '/circles/example',
      templateUrl: 'circles/views/index.html'
    });
  }
]);
