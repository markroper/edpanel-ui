'use strict';
angular.module('teacherdashboard')
  .directive('expressionEditor', [ '$window', 'api', '$compile', function($window, api, $compile) {
    return {
      scope: {
        group: '=',
        queryComponents: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/expressionEditor.html',
      compile: function (element, attrs) {
        var content, directive;
        content = element.contents().remove();
        return function (scope, element, attrs) {
          scope.operators = [
            { name: 'AND' },
            { name: 'OR' }
          ];
          //TODO: remove this
          scope.fields = [
            { name: 'Firstname' },
            { name: 'Lastname' },
            { name: 'Birthdate' },
            { name: 'City' },
            { name: 'Country' }
          ];

          scope.conditions = [
            { name: '=', value: 'EQUAL' },
            { name: '<>', value: 'NOT_EQUAL' },
            { name: '<', value: 'LESS_THAN' },
            { name: '<=', value: 'LESS_THAN_OR_EQUAL' },
            { name: '>', value: 'GREATER_THAN' },
            { name: '>=', value: 'LESS_THAN_OR_EQUAL' }
          ];

          scope.addCondition = function () {
            scope.group.rules.push({
              condition: '=',
              field: 'Firstname',
              data: ''
            });
          };

          scope.removeCondition = function (index) {
            scope.group.rules.splice(index, 1);
          };

          scope.addGroup = function () {
            scope.group.rules.push({
              group: {
                operator: 'AND',
                rules: []
              }
            });
          };

          scope.removeGroup = function () {
            "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
          };

          directive || (directive = $compile(content));

          element.append(directive(scope, function ($compile) {
            return $compile;
          }));
        }
      }
    }
    }]);
