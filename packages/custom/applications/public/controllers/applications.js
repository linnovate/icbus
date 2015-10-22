'use strict';
function AppCtrl(Applications, $location, $stateParams) {
  this.create = create;
  this.uploadFileCallback = uploadFileCallback;
  this.find = find;
  this.remove = remove;
  this.update = update;
  this.findOne = findOne;

  function create(isValid, app) {
    if (isValid) {
      var application = new Applications(app);
      application.$save(function(response) {
        $location.path('applications/' + response._id);
      });

      this.app.name = '';
      this.app.iconPath = '';
    } else {
      this.submitted = true;
    }
  }

  function uploadFileCallback(file) {
    this.app.iconPath = file.src;
  }

  function find() {
    var vm = this;
    console.log('applications');
    Applications.query(function(applications) {
      vm.applications = applications;
      //console.log(applications, 'applications')
    });
  }
  
  
  function remove(application) {
    var vm = this;
    if (application) {
      application.$remove(function(response) {
        for (var i in vm.applications) {
          if (vm.applications[i] === application) {
            vm.applications.splice(i,1);
          }
        }
        $location.path('applications');
      });
    }
    else {
      this.application.$remove(function(response) {
        $location.path('applications');
      });
     }
   }

  function update(isValid) {
     if (isValid) {
       var application = this.application;
       if(!application.updated) {
        application.updated = [];
       }
       application.updated.push(new Date().getTime());

       application.$update(function() {
       $location.path('applications/' + application._id);
       });
     }
     else {
      this.submitted = true;
     }
   }

  function findOne() {
    var vm = this;
    Applications.get({
      applicationId: $stateParams.applicationId
     }, function(application) {
     vm.application = application;
     });
   }
}

angular.module('mean.applications').controller('ApplicationsController', AppCtrl);
AppCtrl.$inject = ['Applications', '$location', '$stateParams'];
