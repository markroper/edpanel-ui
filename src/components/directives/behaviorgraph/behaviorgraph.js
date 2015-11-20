'use strict';
angular.module('teacherdashboard')
  .directive('behaviorgraph', [ '$window', '$compile', '$sanitize','statebag', 'api', function($window, $compile, $sanitize, statebag, api) {
    return {
      scope: {
        weeklyBehaviorPromise: '=',
        section: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/behaviorgraph/behaviorgraph.html',
      replace: true,
      controllerAs: 'ctrl',
      link: function(scope, elem){
        scope.weeklyBehaviorPromise.then(function(theData){
          var exs = {};
          var categorizedData = {};
          var chartData = [];
          var WEEKSCORE = 'score';
          exs[WEEKSCORE] = WEEKSCORE + '_x';
          categorizedData.weekscore = [[WEEKSCORE], [WEEKSCORE + '_x']];
          theData.forEach(function(d){
            categorizedData.weekscore[0].push(Math.round(d.score));
            categorizedData.weekscore[1].push(new Date(d.endDate));
          });
          angular.forEach(categorizedData, function(value, key){
            chartData.push(value[0]);
            chartData.push(value[1]);
          });
          var chart = $window.c3.generate({
            bindto: elem.find('.svg-container')[0],
            point: {
              r: 5
            },
            data: {
              columns: chartData,
              xs: exs,
              type: 'line'
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
