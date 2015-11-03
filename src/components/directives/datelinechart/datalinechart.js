'use strict';
angular.module('teacherdashboard')
  .directive('datetimechart', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        dataPromise: '=',
        slideClosed: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/datelinechart/datelinechart.html',
      replace: true,
      link: function(scope, elem) {
        var elemToBindTo = elem.find('.datelinechart-container');
        scope.chart = $window.c3.generate({
          bindto: elemToBindTo[0],
          data: {
            columns: [
              ['data1', 30, 200, 100, 400, 150, 250],
              ['data2', 50, 20, 10, 40, 15, 25]
            ],
            axes: {
              data2: 'y2'
            }
          },
          axis: {
            y2: {
              show: true // ADD
            }
          }
        });
      }
    };
  }]);