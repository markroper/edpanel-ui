'use strict';
angular.module('teacherdashboard')
.controller('PasswordCtrl', ['$scope', 'api', '$state', 'authentication', 'statebag','statebagApiManager', 'consts',
  function ($scope, api, $state, authentication, statebag, statebagapimanager, consts) {
    statebag.currentPage.name = 'Password Reset';
    $scope.oldPassword = '';
    $scope.newPassword = '';
    $scope.newPassword2 = '';
    $scope.error = {};
    $scope.mode = '';
    $scope.name = authentication.identity().name;

    $scope.changePassword = function() {
      if(!$scope.newPassword || !$scope.newPassword2) {
        $scope.error.msg = "Please type a new password twice";
      } else if($scope.newPassword !== $scope.newPassword2) {
        $scope.error.msg = "The passwords you typed don't match";
      }else if ($scope.newPassword.length < 8) {
        $scope.error.msg = "Passwords must be at least 8 chars";
      } else {
        $scope.error.msg = null;
        $scope.mode = 'indeterminate';
        var changePassword = {
          newPassword: $scope.newPassword
        };
        api.changePassword.put(
          { userId: authentication.identity().id },
          changePassword,
          function(data){
            if(data.currentSchoolId) {
              api.school.get(
                {schoolId: data.currentSchoolId},
                //Success callback
                function (schoolData) {
                  statebag.school = schoolData;
                  statebag.currentYear = statebagapimanager.resolveCurrentYear();
                  statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
                  statebag.lastFullRefresh = null;
                  $state.go('app.home', {schoolId: statebag.school.id});
                },
                //Error callback
                function () {
                  $scope.showErrorMsg = true;
                  $scope.mode = '';
                });
            } else if(data.type === consts.roles.ADMIN ||
              data.type === consts.roles.SUPER_ADMIN) {
              $state.go('app.schoolSelector');
            }
          }),
          function() {
            $scope.mode = '';
            $scope.error.msg = "Could not update password";
          };
      }
    }
  }]);
