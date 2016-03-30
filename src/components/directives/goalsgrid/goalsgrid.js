'use strict';
angular.module('teacherdashboard')
  .directive('goalsgrid', ['$state', 'statebag', 'api','$compile','$timeout','$document',
    function($state, statebag, api,$compile,$timeout,$document) {
      return {
        scope: {
          approvedGoals: '=',
          pendingGoals: '=',
          pgoals: '=',
          agoals: '=',
          sections: '=',
          isAdvisorView: '=',
          test: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/goalsgrid/goalsgrid.html',
        replace: true,
        link: function ($scope, element) {
          $scope.dada = [
            // Order is optional. If not specified it will be assigned automatically
            {name: 'row1', tasks: [
              {name: 'task1', from: new Date(2013, 8, 18), to: new Date(2013, 9, 18)},
          {name: 'task2', from: new Date(2013, 9, 19), to: new Date(2013, 10, 18)}
          ]
        },
          {name: 'row2', tasks: [
            {name: 'task3', from: new Date(2013, 7, 18), to: new Date(2013, 8, 18)},
            {name: 'task4', from: new Date(2013, 9, 18), to: new Date(2013, 10, 18)}
          ]
          }

          ];
          var body = $document.find('#test');
          var template = '<div gantt data="dada"></div>';
          body.append($compile(template)($scope));





        }
      };
    }]);
