'use strict';
angular.module('teacherdashboard').controller('SidenavCtrl', ['$scope', '$state', '$mdSidenav',
function($scope, $state, $mdSidenav) {
    $scope.toggleList =  function() {
      $mdSidenav('left').toggle();
    };
    $scope.goToStudents = function() {
      $state.go('home');
    };
    $scope.goToReports = function() {
      $state.go('reports');
    };
    $scope.goToReportBuilder = function() {
      $state.go('reportbuilder');
    };
  }]);