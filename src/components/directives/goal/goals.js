'use strict';
angular.module('teacherdashboard')
  .directive('goals', ['$state', 'statebag', 'api', function($state, statebag, api) {
    return {
      scope: {
        goals: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goals.html',
      replace: true,
      controller: function($scope) {
        $scope.deleteGoal = function() {
          //Call api to delete the goal
        };
        $scope.editGoal = function(goal) {
          //Call api to edit the goal
          goal.editActive = true;
          goal.blah = Math.floor(Math.random() * 255);

        };
      }
    };
  }])
  .directive('testDragEnd', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        console.log("IT LOADED");
        element.on('$md.dragend', function() {
          console.info('Drag Ended');
        });
        element.on('$md.drag', function() {
          console.info('Drag Start');
        });
        element.on('$md.dragstart', function() {
          console.info('Drag Start');
        });
        element.on('$md.pressdown', function() {
          console.info('Drag Start');
        })
      }
    }
  });
