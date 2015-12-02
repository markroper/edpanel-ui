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
  .directive('stackedbar', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        columnsPromise: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/stackedbar/stackedbar.html',
      replace: true,
      link: function(scope, elem){
        scope.columnsPromise.then(function(theData){
          var groups = [];
          var xTickValues = theData[theData.length - 1].slice(1);
          for(var i = 0; i < theData.length - 1; i++) {
            groups.push(theData[i][0]);
          }

          $window.c3.generate({
            bindto: elem.find('.svg-container')[0],
            data: {
              columns: theData.slice(0, theData.length -1),
              type: 'bar',
              groups: [ groups ],
              order: 'desc'
            },
            legend: {
              position: 'inset'
            },
            color: {
              pattern: ['#1f77b4', '#d62728', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728']
            },
            axis: {
              x: {
                type: 'category',
                categories: xTickValues
              }
            }
          });
        });
      }
    };
  }]);
