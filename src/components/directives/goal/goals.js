'use strict';
angular.module('teacherdashboard')
  .directive('goals', ['$state', 'statebag', 'api', function($state, statebag, api) {
    return {
      scope: {
        goals: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goals.html',
      replace: true,
      controller: function($scope) {
        $scope.deleteGoal = function() {
          //Call api to delete the goal
        };
        $scope.editGoal = function() {
          //Call api to delete the goal
        };
      }
    };
  }]);