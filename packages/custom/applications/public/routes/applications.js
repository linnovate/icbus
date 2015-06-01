'use strict';

//Setting up route
angular.module('mean.applications').config(config);

function config($stateProvider) {

    // states for my app
    $stateProvider
        .state('all applications', {
          url: '/applications',
          templateUrl: '/applications/views/list.html',
          controller: 'ApplicationsController',
          controllerAs: 'vm',
          resolve: {
            loggedin: checkLoggedin
          }
        })
        .state('create application', {
          url: '/applications/new',
          templateUrl: '/applications/views/create.html',
          controller: 'ApplicationsController',
          controllerAs: 'vm',
          resolve: {
            loggedin: checkLoggedin
          }
        })
        .state('edit application', {
          url: '/applications/:applicationId/edit',
          templateUrl: '/applications/views/edit.html',
          controller: 'ApplicationsController',
          controllerAs: 'vm',
          resolve: {
            loggedin: checkLoggedin
          }
        })
        .state('application by id', {
          url: '/applications/:applicationId',
          templateUrl: '/applications/views/view.html',
          controller: 'ApplicationsController',
          controllerAs: 'vm',
          resolve: {
            loggedin: checkLoggedin
          }
        }
    );
}

// Check if the user is connected
function checkLoggedin($q, $timeout, $http, $location) {
  // Initialize a new promise
  var deferred = $q.defer();

  // Make an AJAX call to check if the user is logged in
  $http.get('/api/loggedin').success(function(user) {
    // Authenticated
    if (user !== '0') $timeout(deferred.resolve);

    // Not Authenticated
    else {
      $timeout(deferred.reject);
      $location.url('/login');
    }
  });

  return deferred.promise;
}
