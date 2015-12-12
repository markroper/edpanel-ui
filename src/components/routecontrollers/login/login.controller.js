'use strict';

angular.module('teacherdashboard')
  .directive('edpanelEnterKeypress', function() {
    return function(scope, element, attrs) {

        element.bind('keydown keypress', function(event) {
            var keyCode = event.which || event.keyCode;

            // If enter key is pressed
            if (keyCode === 13) {
                scope.$apply(function() {
                        // Evaluate the expression
                    scope.$eval(attrs.edpanelEnterKeypress);
                });
                event.preventDefault();
            }
        });
    };
  })
  .controller('LoginController', ['$scope', 'api', '$state', 'authentication', 'statebag','statebagApiManager', 'consts', '$window', '$location',
    function ($scope, api, $state, authentication, statebag, statebagapimanager, consts, $window, $location) {
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: $location.url() });
      });
      statebag.currentPage.name = 'Login';
	    $scope.inputEmail = '';
      $scope.password = '';
      $scope.showErrorMsg = false;
      $scope.mode = '';
      $scope.authenticate = function() {
      	var authBody = {
			    username: $scope.inputEmail,
			    password: $scope.password
      	};
        $scope.showErrorMsg = false;
        $scope.mode = 'indeterminate';
        api.login.save(
        	authBody,
          //Success callback
        	function(data) {
            statebag.userRole = data.type.charAt(0) + data.type.toLowerCase().slice(1);
            statebag.theme = statebag.resolveTheme(data.type);
            var identity = {
              username: $scope.inputEmail,
              name: data.name,
              id: data.id,
              roles: [data.type]
            };
        		authentication.authenticate(identity);

            //If the user logged in with a one time use password, redirect them to password
            // reset otherwise all subsequent API calls on this cookie will fail.
            if(data.mustResetPassword) {
              $state.go('app.resetPassword', {userId: data.id});

            }


            //Resolve the school
            if(data.currentSchoolId) {

              //TODO Filter or for teacher vs addmin home pages
              if (data.type === consts.roles.TEACHER) {
                console.log("IT WORKDED");
                console.log(data.currentSchoolId);
                api.school.get(
                  {schoolId: data.currentSchoolId},
                  //Success callback
                  function (schoolData) {
                    statebag.school = schoolData;
                    statebag.currentYear = statebagapimanager.resolveCurrentYear();
                    statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
                    statebag.lastFullRefresh = null;
                    $state.go('app.teacherHome', {schoolId: statebag.school.id});
                  },
                  //Error callback
                  function () {
                    $scope.showErrorMsg = true;
                    $scope.mode = '';
                  });

              } else {
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
              }

            } else if(data.type === consts.roles.ADMIN ||
                data.type === consts.roles.SUPER_ADMIN) {
              console.log('Admin user with no associated school');
              $state.go('app.schoolSelector');
            }
        	},
          //Error callback
          function() {
            $scope.showErrorMsg = true;
            $scope.mode = '';
          }
        );
      };
  }]);
