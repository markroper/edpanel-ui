'use strict';
angular.module('teacherdashboard')
  .directive('goal', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window','$compile',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window, $compile) {
    return {
      scope: {
        goal: '=',
        pendingGoals: '=',
        editable: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goal.html',
      replace: true,
      controller: function($scope) {


        $scope.sectionsResolved = false;

        var showSimpleToast = function(msg) {
          mdToast.show(
            mdToast.simple()
              .content(msg)
              .action('OK')
              .hideDelay(2000)
          );
        };


        $scope.deleteGoal = function(goal) {
          api.editStudentGoal.delete(
            { studentId: goal.student.id,
              goalId: goal.id},
            function() {
              var index = $scope.pendingGoals.indexOf(goal);
              $scope.pendingGoals.splice(index,1);
              showSimpleToast('Goal successfully deleted');
            },
            function() {
              showSimpleToast('Goal could not be deleted');
            });
          //Call api to delete the goal
        };
        $scope.editGoal = function(goal) {
          //Call api to edit the goal
          goal.editActive = true;

        };

        $scope.proposeEdit = function(goal) {
          delete goal.editActive;
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           goal,
            function() {
              $scope.resolveGoalDisplay(true);
              showSimpleToast('Goal changed successfully');
            },
            function() {
              showSimpleToast('There was a problem modifying the goal');

            });
        };
      },
      link: function($scope,elem) {
        var $woopContainer = angular.element(elem).find('.woop-container');
        var SLIDE_OPEN_CLASS = 'slide-open-woop';
        var SLIDE_CLOSED_CLASS = 'slide-closed-woop';
        var $woopArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';

        $scope.showWoop = function() {
          console.log("WOOP");

          $woopContainer.toggleClass(SLIDE_OPEN_CLASS);
          $woopContainer.toggleClass(SLIDE_CLOSED_CLASS);
          if($woopArrowIcon.hasClass(ROTATE)) {
            $woopArrowIcon.removeClass(ROTATE);
            $woopArrowIcon.addClass(ROTATE_COUNTERWISE);
          } else {
            $woopArrowIcon.removeClass(ROTATE_COUNTERWISE);
            $woopArrowIcon.addClass(ROTATE);
          }

        };

        $scope.resolveGoalDisplay = function(refresh) {
          var renderFunction = function(value) {
            if(isNaN(value)) {
              return '--';
            } else {
              return Math.round(value);
            }
          };
          var goal = $scope.goal;

          if (refresh) {
            angular.element(document).find('#gauge-'+ goal.id).empty();
            $scope.gage = new $window.JustGage({
              id: 'gauge-'+ goal.id,
              value: goal.calculatedValue,
              min: 0,
              max: goal.desiredValue,
              minTxt:0,
              maxTest:100,
              valueMinFontSize: 50,
              textRenderer: renderFunction,
              levelColors: [
                '#F44366',
                '#FFEB3B',
                '#4CAF50'
              ]
            });
          }

          if (!refresh) {
            $timeout(function() {
              $scope.gage = new $window.JustGage({
                id: 'gauge-'+ goal.id,
                value: goal.calculatedValue,
                min: 0,
                max: goal.desiredValue,
                minTxt:0,
                maxTest:100,
                valueMinFontSize: 50,
                textRenderer: renderFunction,
                levelColors: [
                  '#F44366',
                  '#FFEB3B',
                  '#4CAF50'
                ]
              });
            }, 50);
          }

        };

  $scope.resolveGoalDisplay(false);
      }


    };

  }]);
