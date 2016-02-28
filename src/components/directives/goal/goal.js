'use strict';
angular.module('teacherdashboard')
  .directive('goal', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window) {
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
          $scope.proposeEdit(goal, false, true);
        };
        $scope.markFailed = function(goal) {
          goal.goalProgress = 'UNMET';
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
          goal.approved = true;
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
      link: function($scope) {
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
              minLabelMinFontSize: 14,
              maxLabelMinFontSize: 18,
              labelFontColor: '#303030',
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
                minLabelMinFontSize: 14,
                maxLabelMinFontSize: 18,
                labelFontColor: '#303030',
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
