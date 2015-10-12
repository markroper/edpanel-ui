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
      replace: true,
      link: function(scope, elem){
        scope.element = elem;
        //In order to make tooltip borders partially transparent, we have to 
        //convert from hex to RGB because the visualization tool gives us colors as hex
        scope.hexToRgb = function(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 
                'rgba(' + 
                parseInt(result[1], 16) + ', ' + 
                parseInt(result[2], 16) + ', ' + 
                parseInt(result[3], 16) + ', 0.8);'
            : null;
        };
      }
    };
  }]);