'use strict';
angular.module('teacherdashboard')
  .directive('gradedonut', ['$window', 'api', function($window, api) {
    return {
      scope: {
        courseTitle: '@',
        gradeWeights: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/gradedonut/gradedonut.html',
      replace: true,
      link: function(scope, elem){
          scope.element = elem;
          scope.chart = $window.c3.generate({
              bindto: elem[0],
              data: {
                columns: scope.gradeWeights,
                type : 'donut'
              },
              donut: {
                title: scope.courseTitle
              }
          });
      }
    };
  }]);