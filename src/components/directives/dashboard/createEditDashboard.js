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
        scope.gridsterOpts = {
          columns: 6,
          swapping: true,
          pushing: true,
          minSizeX: 2,
          maxSizeX: 6,
          minSizeY: 1,
          maxSizeY: 1
        };

        scope.dashboardReports = [];
        scope.$watch(
          'dashboard',
          function( newValue, oldValue ) {
            if(newValue && !angular.equals(newValue, oldValue)) {
              scope.dashboardReports = scope.processDashboard();
            }
          }
        );

        scope.processDashboard = function() {
          var gridsterData = [];
          if(scope.dashboard) {
            for (var m = 0; m < scope.dashboard.rows.length; m++) {
              var currRow = scope.dashboard.rows[m];
              for (var n = 0; n < currRow.reports.length; n++) {
                var currReport = currRow.reports[n];
                var gElement = {
                  sizeX: 6 * 1 / currRow.reports.length,
                  //sizeY: 0.5,
                  row: m,
                  col: n * 6 * 1 / currRow.reports.length,
                  report: currReport
                };
                gridsterData.unshift(gElement);
              }
            }
          }
          return gridsterData;
        };
      }
    };
  }]);
