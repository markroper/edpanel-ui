'use strict';
angular.module('teacherdashboard')
  .directive('goal', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window','statebagApiManager',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window, statebagApiManager) {
    return {
      scope: {
        goal: '=',
        pendingGoals: '=',
        approvedGoals:'=',
        editable: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goal.html',
      replace: true,
      controller: function($scope) {
        $scope.userRole = statebag.userRole;
        $scope.sectionsResolved = false;

        var showSimpleToast = function(msg) {
          mdToast.show(
            mdToast.simple()
              .content(msg)
              .action('OK')
              .hideDelay(2000)
          );
        };

        $scope.markAchieved = function(goal) {
          goal.goalProgress = 'MET';
          goal.endDate = statebagApiManager.resolveCurrentDate();
          goal.finalValue = goal.calculatedValue;
          $scope.proposeEdit(goal, false, true);
        };
        $scope.markFailed = function(goal) {
          goal.goalProgress = 'UNMET';
          goal.endDate = statebagApiManager.resolveCurrentDate();
          goal.finalValue = goal.calculatedValue;
          $scope.proposeEdit(goal, false, true);
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

        $scope.approveGoal = function(goal) {
          goal.approved = statebagApiManager.resolveCurrentDate();
          $scope.proposeEdit(goal, true);
        };

        $scope.proposeEdit = function(goal, moveToApproved, removeFromActive) {
          delete goal.editActive;
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           goal,
            function() {
              $scope.resolveGoalDisplay(true);
              if(moveToApproved) {
                var index = $scope.pendingGoals.indexOf(goal);
                $scope.pendingGoals.splice(index, 1);
                if(!$scope.approvedGoals) {
                  $scope.approvedGoals = [];
                }
                $scope.approvedGoals.push(goal);
              } else if(removeFromActive) {
                var index = $scope.approvedGoals.indexOf(goal);
                $scope.approvedGoals.splice(index, 1);
              }
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
        var BEHAVIOR = 'BEHAVIOR';
        var negBehaviors = ['DEMERIT','DETENTION', 'OUT_OF_SCHOOL_SUSPENSION','IN_SCHOOL_SUSPENSION','REFERRAL'];

        var evaluateGaugeColor = function(goal) {
          var posColors = ['#FF3333', '#FFEB3B', '#4CAF50'];
          var negColors = [ '#4CAF50', '#FFEB3B','#FF3333'];

          if (goal.goalType === 'BEHAVIOR') {
            if (negBehaviors.indexOf(goal.behaviorCategory) >= 0) {
              //We have a negative behavior goal here.
              return negColors;
            }
            return posColors;
          } else {
            return posColors;
          }

        };

        $scope.showWoop = function() {

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
          console.log(goal);

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
              minLabelMinFontSize: 14,
              maxLabelMinFontSize: 18,
              labelFontColor: '#303030',
              levelColors: evaluateGaugeColor(goal)
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
                minLabelMinFontSize: 14,
                maxLabelMinFontSize: 18,
                labelFontColor: '#303030',
                levelColors: evaluateGaugeColor(goal)
              });
            }, 50);
          }

        };

  $scope.resolveGoalDisplay(false);
      }


    };

  }]);
