'use strict';
angular.module('teacherdashboard')
  .directive('datetimechart', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        dateTimeDataPromise: '=',
        slideClosed: '=',
        keyToX: '@',
        keyToY: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/datelinechart/datelinechart.html',
      replace: true,
      link: function(scope, elem) {
        var elemToBindTo = elem.find('.datelinechart-container');

        scope.dateTimeDataPromise.then(function(theData){
          scope.chart = $window.c3.generate({
            bindto: elemToBindTo[0],
            data: {
              json: theData,
              type: 'line',
              keys: {
                x: scope.keyToX,
                value:[scope.keyToY]
              }
            },
            grid: {
              x: {
                lines: [
                  { value: new Date(), text: 'today' }
                ]
              }
            },
            axis: {
              y : {
                tick: {
                  format: function (d) { return Math.round(d * 10) / 10; }
                }
              },
              x: {
                type: 'timeseries',
                tick: {
                  centered: true,
                  format: '%m-%d',
                  fit: true
                }
              }
            }
          });
        });
      }
    };
  }]);
