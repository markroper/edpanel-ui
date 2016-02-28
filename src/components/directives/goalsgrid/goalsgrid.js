'use strict';
angular.module('teacherdashboard')
  .directive('goalsgrid', ['$state', 'statebag', 'api',
    function($state, statebag, api) {
      return {
        scope: {
          approvedGoals: '=',
          pendingGoals: '=',
          pgoals: '=',
          agoals: '=',
          sections: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/goalsgrid/goalsgrid.html',
        replace: true,
        controller: function ($scope) {


        }


      }
    }]);
