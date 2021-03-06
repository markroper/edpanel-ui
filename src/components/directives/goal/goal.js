'use strict';
angular.module('teacherdashboard')
  .directive('goal', ['$state', 'statebag', 'api','$q', '$mdToast', '$document','$timeout','$window','statebagApiManager','analytics',
    function($state, statebag, api, $q, mdToast, $document, $timeout,$window, statebagApiManager, analytics) {
    return {
      scope: {
        goal: '=',
        pendingGoals: '=',
        approvedGoals:'=',
        editable: '@',
        goalIdSuffix: '@',
        advisorView:'='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goal.html',
      replace: true,
      controller: function($scope) {
        var ga_pageName;
        if ($scope.advisorView) {
          ga_pageName = analytics.GOALS_ADVISOR;
        } else {
          ga_pageName = analytics.GOALS_TAB;
        }
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
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_MET, ga_pageName );
          goal.goalProgress = 'MET';
          goal.endDate = $window.moment().format('YYYY-MM-DD');
          goal.finalValue = goal.calculatedValue;
          $scope.proposeEdit(goal, false, true);
        };
        $scope.markFailed = function(goal) {
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_NOT_MET, ga_pageName );
          goal.goalProgress = 'UNMET';
          goal.endDate = $window.moment().format('YYYY-MM-DD');
          goal.finalValue = goal.calculatedValue;
          $scope.proposeEdit(goal, false, true);
        };
        $scope.deleteGoal = function(goal) {
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_DELETE, ga_pageName );
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
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_EDIT_START, ga_pageName );
          //Call api to edit the goal
          if (!$scope.woopOpen) {
            $scope.showWoop();
          }
          goal.editActive = true;

        };

        $scope.approveGoal = function(goal) {
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_APPROVE, ga_pageName );
          goal.approved = statebagApiManager.resolveCurrentDate();
          $scope.proposeEdit(goal, true);
        };

        $scope.proposeEdit = function(goal, moveToApproved, removeFromActive) {
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_EDIT_COMPLETE, ga_pageName );
          delete goal.editActive;
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           goal,
            function() {
              $scope.resolveGoalDisplay(true);
              var index = null;
              $scope.showWoop();
              if(moveToApproved) {
                index = $scope.pendingGoals.indexOf(goal);
                $scope.pendingGoals.splice(index, 1);
                if(!$scope.approvedGoals) {
                  $scope.approvedGoals = [];
                }
                $scope.approvedGoals.push(goal);
              } else if(removeFromActive) {
                index = $scope.approvedGoals.indexOf(goal);
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
        $scope.woopOpen = false;
        var $woopContainer = angular.element(elem).find('.woop-container');
        var SLIDE_OPEN_CLASS = 'slide-open-woop';
        var SLIDE_CLOSED_CLASS = 'slide-closed-woop';
        var $woopArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';
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

        //Created for analytics to distinguish between a user open and a forced open
        $scope.showWoopUser = function(){
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_SHOW_WOOP, $scope.goal.goalProgress );
          $scope.showWoop();
        };
        $scope.openVert = function() {
          analytics.sendEvent(analytics.GOALS, analytics.GOAL_SHOW_MORE, $scope.goal.goalProgress );
        }
        $scope.showWoop = function() {
          if ($scope.woopOpen) {
            $scope.woopOpen = false;
          } else {
            $scope.woopOpen = true;
          }
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

          var min = 0;
          if (goal.goalType === 'SECTION_GRADE' && goal.desiredValue > 50) {
            min = 50;
          }
          if (refresh) {
            angular.element($document).find('#gauge-'+ goal.id + '-' + $scope.goalIdSuffix).empty();
            $scope.gage = new $window.JustGage({
              id: 'gauge-'+ goal.id + '-' + $scope.goalIdSuffix,
              value: goal.calculatedValue,
              min: min,
              max: goal.desiredValue,
              minTxt:min,
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
                id: 'gauge-'+ goal.id + '-' + $scope.goalIdSuffix,
                value: goal.calculatedValue,
                min: min,
                max: goal.desiredValue,
                minTxt:min,
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
