'use strict';
angular.module('teacherdashboard').controller('SidenavCtrl', ['$scope', '$state', '$mdSidenav',
function($scope, $state, $mdSidenav) {
    $scope.toggleList =  function() {
      $mdSidenav('left').toggle();
    };
    $scope.goToStudents = function() {
      $state.go('app.home');
    };
    $scope.goToReports = function() {
      $state.go('app.reports');
    };
    $scope.goToReportBuilder = function() {
      $state.go('app.reportbuilder');
    };
  }]);