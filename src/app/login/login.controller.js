'use strict';

angular.module('teacherdashboard')
  .controller('LoginController', ['$scope', 'api', '$state', 'authentication',
    function ($scope, api, $state, authentication) {
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
            $state.go('app.home');
        	},
          //Error callback
          function() {
            $scope.showErrorMsg = true;
          }
        );
      };
}]);