'use strict';

angular.module('teacherdashboard')
  .controller('LoginController', ['$scope', 'api', '$state', 'authentication', 'statebag',
    function ($scope, api, $state, authentication, statebag) {
	    $scope.inputEmail = '';
      $scope.password = '';
      $scope.showErrorMsg = false;
      $scope.authenticate = function() {
      	var authBody = {
			    username: $scope.inputEmail,
			    password: $scope.password
      	};
        $scope.showErrorMsg = false;
        api.login.save(
        	authBody,
          //Success callback
        	function(data) {
            var identity = {
              username: $scope.inputEmail,
              id: null,
              roles: [data.authorities[0].authority]
            };
        		authentication.authenticate(identity);
            //Resolve the school
            //TODO: for now we just grab the first school in the district. Need a better way
            api.schools.get(
              {},
              //Success callback
              function(data){
                  statebag.school = data[0];
                  statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
                  statebag.currentTerm = statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
                  $state.go('app.home', { schoolId: statebag.school.id });
              },
              //Error callback
              function(){
                  $scope.showErrorMsg = true;
            });
        	},
          //Error callback
          function() {
            $scope.showErrorMsg = true;
          }
        );
      };
}]);