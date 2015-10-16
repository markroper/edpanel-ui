'use strict';
angular.module('teacherdashboard').controller('NavCtrl', ['$scope', '$state', '$mdSidenav', 'api', 'statebag',
function($scope, $state, $mdSidenav, api, statebag) {
    $scope.userRole = statebag.userRole;
    $scope.theme = statebag.theme;
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
              statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
              statebag.currentTerm = statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
              $state.go('app.home', { schoolId: statebag.school.id });
          });
      }

    }
    $scope.toggleList =  function() {
      $mdSidenav('left').toggle();
    };
    $scope.goToHome = function() {
      $state.go('app.home', { schoolId: $state.params.schoolId });
    };
    $scope.goToAdmin = function() {
      $state.go('app.admin', { schoolId: $state.params.schoolId });
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