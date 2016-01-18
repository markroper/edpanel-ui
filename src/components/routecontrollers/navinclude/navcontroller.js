'use strict';
angular.module('teacherdashboard').controller('NavCtrl', ['$scope', '$state', '$mdSidenav', 'api', 'statebag', 'statebagApiManager', 'authentication', 'UAService', 'consts',
function($scope, $state, $mdSidenav, api, statebag, statebagapimanager, authentication, UAService, consts) {
    $scope.statebag = statebag;
    $scope.userRole = statebag.userRole;
    $scope.currentPage = statebag.currentPage;
    $scope.theme = statebag.theme;
    $scope.UAService = UAService;

    switch ($scope.userRole.toUpperCase()) {
      case consts.roles.ADMIN:
        $scope.homePageName = "Student List";
        break;
      case consts.roles.TEACHER:
        $scope.homePageName = "Section List";
        break;
      case consts.roles.SUPER_ADMIN:
        $scope.homePageName = "Student List";
        break;
      default:
        $scope.homePageName = "Student List";
        break;
    }

    //TODO: make notification loading dynamic, with websocket?
    $scope.notificationList = [
      { title: 'Mark Roper - homework', type:'STUDENT', id:1, measure:'HOMEWORK', message:'Homework completion up 10% in the last 7 days', studentId: 1 },
      { title: 'Mark Roper - pride score', type:'STUDENT', id:1, measure:'BEHAVIOR', message:'Mark Roper\'s pride score of 70 this week is 25% lower than his average', studentId: 1 },
      { title: '9th Grade - GPA', type:'GRADE LEVEL', measure:'GPA', id: 2, schoolId: 1, gradeId: 2, message: 'Average 9th grade GPA at Excel declined 0.1 this quarter' }
    ];
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

    $scope.goToStudentList = function() {
      $state.go('app.home', { schoolId: $state.params.schoolId });
      $scope.closeSizeNav();
    };
  $scope.goToTeacherClasses = function() {
    $state.go('app.teacherHome', {schoolId: statebag.school.id});
    $scope.closeSizeNav();
  }
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
