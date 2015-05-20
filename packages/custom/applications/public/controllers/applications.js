'use strict';

/* jshint -W098 */
angular.module('mean.applications').controller('ApplicationsController', ['$scope', 'Global', 'Applications',
  function($scope, Global, Applications) {
    $scope.global = Global;
    $scope.package = {
      name: 'applications'
    };
  }
]);
