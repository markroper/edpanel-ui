'use strict';
angular.module('teacherdashboard').controller('SidenavCtrl', ['$scope', '$state', '$mdSidenav',
function($scope, $state, $mdSidenav) {
    $scope.toggleList =  function() {
      $mdSidenav('left').toggle();
    };
    $scope.goToStudents = function() {
      $state.go('app.home', { schoolId: $state.params.schoolId });
    };
    $scope.goToReports = function() {
      $state.go('app.reports', { schoolId: $state.params.schoolId });
    };
    $scope.goToReportBuilder = function() {
      $state.go('app.reportbuilder', { schoolId: $state.params.schoolId });
    };
  }]);