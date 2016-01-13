'use strict';
angular.module('teacherdashboard').controller('NavCtrl', ['$scope', '$state', '$mdSidenav', 'api', 'statebag', 'statebagApiManager', 'authentication', 'UAService',
function($scope, $state, $mdSidenav, api, statebag, statebagapimanager, authentication, UAService) {
    $scope.statebag = statebag;
    $scope.userRole = statebag.userRole;
    $scope.currentPage = statebag.currentPage;
    $scope.theme = statebag.theme;
    $scope.UAService = UAService;

    //TODO: make notification loading dynamic, with websocket?
    $scope.notificationList = [];

    api.getTriggeredNotifications.get(
      { userId: authentication.identity().id },
      function(resp){
        $scope.notificationList = resp;
      });

    //This base state should always redirect home...
    if($state.current.name === 'app') {
      //TODO: for now we just grab the first school in the district. Need a better way
      if(statebag.school) {
        $state.go('app.home', { schoolId: statebag.school.id });
      } else {
        api.schools.get(
          {},
          //Success callback
          function(data) {
              statebag.school = data[1];
              statebag.currentYear = statebagapimanager.resolveCurrentYear();
              statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
              $state.go('app.home', { schoolId: statebag.school.id });
          });
      }

    }
    var SIDE_NAV_NAME = 'left';
    $scope.closeSizeNav = function() {
      $mdSidenav(SIDE_NAV_NAME).close();
    };
    $scope.toggleSideNav = function() {
      $mdSidenav(SIDE_NAV_NAME).toggle();
    };

    $scope.goToHome = function() {
      $state.go('app.home', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
    $scope.goToMySurveys = function() {
      $state.go('app.mySurveys', {});
      $scope.closeSizeNav();
    };
    $scope.goToMySurveyResponses = function() {
      $state.go('app.mySurveyResponses', {});
      $scope.closeSizeNav();
    };
    $scope.goToSchoolDash = function() {
      $state.go('app.schoolDash', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
    $scope.goToAdmin = function() {
      $state.go('app.admin', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
    $scope.goToChangePassword = function() {
      $state.go('app.resetPassword', { userId: authentication.identity().id });
      $scope.closeSizeNav();
    };
    $scope.goToReports = function() {
      $state.go('app.reports', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
    $scope.goToReportBuilder = function() {
      $state.go('app.reportbuilder', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
    $scope.logout = function() {
        api.logout.save(
          {},
          function(){
            $state.go('login');
          });
    };

    var originatorEv;
    $scope.openMenu = function($mdOpenMenu, ev) {
      originatorEv = ev;
      $mdOpenMenu(ev);
    };
  }]);
