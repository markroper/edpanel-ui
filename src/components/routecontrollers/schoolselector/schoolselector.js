'use strict';

angular.module('teacherdashboard').
  controller('SchoolSelector', ['$scope', 'api', '$state', 'statebag','statebagApiManager',
  function ($scope, api, $state, statebag, statebagapimanager) {
    statebag.currentPage.name = 'District Schools';
    $scope.goToSchool = function(school) {
      statebag.school = school;
      statebag.currentYear = statebagapimanager.resolveCurrentYear();
      statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
      statebag.lastFullRefresh = null;
      $state.go('app.home', { schoolId: statebag.school.id });
    };
    api.schools.get({}, function(results){
      $scope.schools = results;
    });
  }]);
