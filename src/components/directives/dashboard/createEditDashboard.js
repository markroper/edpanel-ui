'use strict';
angular.module('teacherdashboard')
  .directive('createEditDashboard', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        dashboard: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditDashboard.html',
      replace: true,
      link: function(scope){
        scope.flexSize = function(row) {
          if(row.reports.length === 3) {
            return 33;
          } else if(row.reports.length === 2) {
            return 50;
          } else {
            return 100;
          }
        };
      }
    };
  }]);
