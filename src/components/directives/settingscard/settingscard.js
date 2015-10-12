'use strict';
angular.module('teacherdashboard')
  .directive('settingsCard', ['$window', 'api', function($window, api) {
    return {
      scope: {
        thresholdChar: '@',
        name: '@',
        isTemporal: '@',
        green: '=',
        yellow: '=',
        period: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/settingscard/settingscard.html',
      replace: true
    };
  }]);