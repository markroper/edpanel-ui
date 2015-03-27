'use strict';
angular.module('studentdashboard')
  .directive('studentgoals', [function() {
    return {
      scope: {
      },
      restrict: 'E',
      templateUrl: 'components/goals/studentgoals.html',
      replace: true,
      controller: 'StudentGoalsCtrl',
      controllerAs: 'ctrl',
      link: function(){}
    };
  }]).controller('StudentGoalsCtrl', ['$scope', '$state', function($scope, $state) {
    $scope.name = 'Current Goals';

    $scope.title = 'My gauge';
    $scope.titleFontColor = 'blue';
    $scope.levelColors = [ '#ff0000', '#f9c802', '#a9d70b' ]; 
    $scope.goToBehavior = function() {
      $state.go('behavior');
    };
    $scope.goToAssignments = function() {
      $state.go('assignments');
    };
    $scope.goToCourses = function() {
      $state.go('courses');
    };
  }]);