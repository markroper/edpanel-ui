'use strict';
angular.module('teacherdashboard')
  .directive('datetimechart', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        dateTimeDataPromise: '=',
        slideClosed: '=',
        seriesName: '='
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
                x:'weekEnding',
                value:['score']
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
                  format: function (d) { return Math.round(d); }
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
