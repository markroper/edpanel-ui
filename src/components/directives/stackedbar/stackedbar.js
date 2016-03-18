'use strict';
/*
  Column data promise should be of the form:

   [
     ['data1', 130, 200, 320, 400, 530, 750],
     ['data2', -130, 10, 130, 200, 150, 250],
     ['data3', -130, -50, -10, -200, -250, -150],
     ['students', 'mark', 'matt', 'jordan', 'chris', '', ''] <--- the x axis labels
   ]
 */
angular.module('teacherdashboard')
  .directive('stackedbar', [ '$window', 'api', '$timeout', function($window, api, $timeout) {
    return {
      scope: {
        columnsPromise: '=',
        onClickCallback: '=',
        chartType: '=',
        newData: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/stackedbar/stackedbar.html',
      replace: true,
      link: function(scope, elem, attrs){
        if(!scope.chartType) {
          scope.chartType = 'bar';
        } else {
          scope.chartType = scope.chartType.toLowerCase();
        }
        var insetPosition = attrs.sbLegendPos;
        if(typeof insetPosition === 'undefined') {
          insetPosition = 'top-left';
        }
        scope.$watch('newData', function(newValue, oldValue) {
          if(newValue && !angular.equals(newValue, oldValue)) {
            createChart(newValue);
          }
        });
        var createChart = function(theData) {
          var groups = [];
          var xTickValues = theData[theData.length - 1].slice(1);
          for(var i = 0; i < theData.length - 1; i++) {
            groups.push(theData[i][0]);
          }
          $timeout(function() {
            scope.chart = $window.c3.generate({
              bindto: elem.find('.svg-container')[0],
              data: {
                columns: theData.slice(0, theData.length -1),
                type: scope.chartType,
                groups: [ groups ],
                order: 'desc',
                onclick: function(d, element) {
                  if(scope.onClickCallback) {
                    scope.onClickCallback(d, element);
                  }
                }
              },
              legend: {
                position: 'inset',
                inset: {
                  anchor: insetPosition
                }
              },
              color: {
                pattern: ['#1f77b4', '#d62728', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728']
              },
              axis: {
                x: {
                  type: 'category',
                  categories: xTickValues,
                  tick: {
                    fit: true
                  }
                }
              }
            });
          }, 50);
        };
      }
    };
  }]);
