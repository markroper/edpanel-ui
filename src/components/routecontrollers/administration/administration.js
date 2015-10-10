'use strict';
angular.module('teacherdashboard')
.controller('AdministrationCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts',
  function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts) {
    //Resolve the invalidated users
    api.users.get(
      { schoolId: statebag.school.id,
        enabled: false },
      function(data) {
        $scope.firstTimeUsers = data;
      });

    $scope.saveUserEmailAndSendInvite = function(user) {
      console.log("hello " + JSON.stringify(user));
      if(user && user.type && user.email) {
        var patchUser = {};
        patchUser.email = user.email;
        patchUser.type = user.type;
        //TODO: this doesn't work because the email address attribute has been removed from user
        //Need to establish a shared vision of the expected behavior of the user's endpoint with @jodamn
        api.user.put({ userId: user.id }, user, function(response){
            console.log(response);
            //TODO: kick off the invite user/password reset flow for the user who now has an email address
        });
      }
    };

  }]);