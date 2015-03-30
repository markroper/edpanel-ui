'use strict';
angular.module('teacherdashboard').controller('SidenavCtrl', ['$scope', '$state', '$mdSidenav',
function($scope, $state, $mdSidenav) {
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
    $scope.toggleList =  function() {
      $mdSidenav('left').toggle();
    };
  }]);