'use strict';
angular.module('studentdashboard').controller('SidenavCtrl', ['$scope', '$state', 
function($scope, $state) {
    $scope.goToBehavior = function() {
      $state.go('behavior');
    };
    $scope.goToAssignments = function() {
      $state.go('assignments');
    };
    $scope.goToCourses = function() {
      $state.go('courses');
    };
    $scope.goToGoals = function() {
      $state.go('home');
    };
  }]);