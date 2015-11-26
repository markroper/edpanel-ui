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
  .controller('LoginController', ['$scope', 'api', '$state', 'authentication', 'statebag','statebagApiManager',
    function ($scope, api, $state, authentication, statebag, statebagapimanager) {
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
            //Resolve the school
            //TODO: for now we just grab the first school in the district. Need a better way
            api.school.get(
              { schoolId: data.currentSchoolId },
              //Success callback
              function(schoolData){
                  statebag.school = schoolData;
                  statebag.currentYear = statebagapimanager.resolveCurrentYear();
                  statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
                  $state.go('app.home', { schoolId: statebag.school.id });
              },
              //Error callback
              function(){
                  $scope.showErrorMsg = true;
                  $scope.mode = '';
            });
        	},
          //Error callback
          function() {
            $scope.showErrorMsg = true;
            $scope.mode = '';
          }
        );
      };
  }]);
