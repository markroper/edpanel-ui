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

      }
    };
  }]);
