'use strict';
angular.module('teacherdashboard').controller('NavCtrl', ['$scope', '$state', '$mdSidenav', 'api',
function($scope, $state, $mdSidenav, api) {
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
    $scope.logout = function() {
        api.logout.save(
          {}, 
          function(data){
            $state.go('login');
          });
    };

    var originatorEv;
    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    };
  }]);