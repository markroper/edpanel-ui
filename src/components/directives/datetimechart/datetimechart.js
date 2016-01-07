'use strict';
angular.module('teacherdashboard')
  .directive('datetimechart', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        dateTimeDataPromise: '=',
        slideClosed: '=',
        keyToX: '@',
        keyToY: '@',
        objectField: '@',
        yScalingFactor: '@',
        yDataLabel: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/datetimechart/datetimechart.html',
      replace: true,
      link: function(scope, elem) {
        var elemToBindTo = elem.find('.datelinechart-container');



        scope.dateTimeDataPromise.then(function(theData){
          //If we don't specify a label, just use the name of the data in the json
          if (!scope.yDataLabel) {
             scope.yDataLabel = scope.keyToY;
          }
          //If an object field is specified we need to remove all the other data and only care about the array on that object
          if (scope.objectField) {
            theData = theData[scope.objectField];
          }

          //If we don't multiple this data by some factor multiple it by 1
          if (!scope.yScalingFactor) {
            scope.yScalingFactor = 1;
          }
          //Less then ideal, but we need to scale data by a value because grades come back as .75
          //We are also doing this so we can have custom labels on this thing
          for (var i = 0; i < theData.length; i++) {
            //Now we access data for plotting by [scope.yDataLabel]
            theData[i][scope.yDataLabel] = theData[i][scope.keyToY] * scope.yScalingFactor;
          }
          scope.chart = $window.c3.generate({
            bindto: elemToBindTo[0],
            data: {
              json: theData,
              type: 'line',
              keys: {
                x: scope.keyToX,
                value:[scope.yDataLabel]
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
