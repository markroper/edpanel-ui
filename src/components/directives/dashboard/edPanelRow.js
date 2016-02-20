'use strict';
angular.module('teacherdashboard')
  .directive('edpanelRow', [ '$window', 'api', 'statebag', function($window, api, statebag) {
    return {
      scope: {
        rowContents: '=',
        terms: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/edpanelRow.html',
      replace: true,
      link: function(scope, elem){
        scope.reports = scope.rowContents.reports;

        scope.flexSize = function() {
          if(scope.reports.length === 3) {
            return 33;
          } else if(scope.reports.length === 2) {
            return 50;
          } else {
            return 100;
          }
        };
      }
    };
  }]);
