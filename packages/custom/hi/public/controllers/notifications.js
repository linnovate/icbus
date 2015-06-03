'use strict';

/* jshint -W098 */
angular.module('mean.notifications').controller('NotificationsController', ['$scope', 'Global', 'Notifications',
  function($scope, Global, Notifications) {
    $scope.global = Global;
    $scope.package = {
      name: 'notifications'
    };
  }
]);
