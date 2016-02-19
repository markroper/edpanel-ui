'use strict';
angular.module('teacherdashboard')
  .controller('NewSchoolDash', ['$scope', 'api', 'statebag', '$q',  '$window', 'analytics', '$compile', 'authentication',
    function ($scope, api, statebag, $q, $window, analytics, $compile, authentication) {
      $scope.$on('$viewContentLoaded', function () {
        $window.ga('send', 'pageview', {page: "/ui/schools/*/dashboard"});
      });
      statebag.currentPage.name = 'School Dashboard';

      $scope.terms = [];
      api.terms.get(
        {
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id
        },
        function(results) {
          $scope.terms = results;
        });

      //get the dashboard
      api.dashboard.get(
        { schoolId: statebag.school.id, userId: authentication.identity().id },
        function(dashboard) {
          $scope.dashboard = dashboard;
        });
    }]);