'use strict';
angular.module('teacherdashboard')
  .directive('createEditReport', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        report: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditReport.html',
      replace: true,
      link: function(scope){
        scope.xOptions = [ 'assignment date', 'GPA', 'Referrals', 'Failing classes' ];
        scope.yOptions = [ 'Count of Students', 'SUM referrals'];
        scope.groupByOptions = ['Race', 'Ethnicity', 'ELL', 'SPED'];

        scope.addBuckets = function() {
          //TODO:implement
        }
      }
    };
  }]);
