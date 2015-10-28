'use strict';
angular.module('teacherdashboard')
  .directive('goals', ['$state', 'statebag', 'api','$q', '$mdToast', function($state, statebag, api, $q, mdToast) {
    return {
      scope: {
        goals: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goals.html',
      replace: true,
      controller: function($scope) {


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
              var index = $scope.goals.indexOf(goal);
              $scope.goals.splice(index,1);
            },
            function(error) {
              showSimpleToast("Goal could not be deleted");
            });
          //Call api to delete the goal
        };
        $scope.editGoal = function(goal) {
          //Call api to edit the goal
          goal.editActive = true;

        };
        $scope.proposeEdit = function(goal) {
          goal.editActive = false;
          var datifyGoal = function(goal) {
            var apiGoal = angular.extend({}, goal);

            delete apiGoal.colorClass;
            delete apiGoal.maxDisplay;
            delete apiGoal.maxPossible;
            delete apiGoal.progressText;
            delete apiGoal.proposedValue;
            delete apiGoal.title;
            delete apiGoal.max;
            delete apiGoal.width;
            delete apiGoal.aveValue;
            delete apiGoal.editActive;
            return apiGoal;

          }
          goal.desiredValue = goal.proposedValue;
          var apiGoal = datifyGoal(goal);
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           apiGoal,
            function() {
              $scope.resolveGoalDisplay();
              showSimpleToast("Goal changed successfully");
            },
            function(error) {
              showSimpleToast("There was a problem modifying the goal");

            });


        }
      },
      link: function($scope) {
        function resolveGoalDataAndDisplay() {
          resolveStudentGoals()
            .then(function() {
              $scope.goals = statebag.goals;
              $scope.resolveGoalDisplay();
            });
        }

        function resolveStudentGoals() {
          var deferred = $q.defer();

          var studentGoalsPromises = api.studentGoals.get( {
            studentId: $state.params.studentId }).$promise;

          studentGoalsPromises.then(function (response) {
            statebag.goals = response;
            deferred.resolve(statebag.goals);
          });
          return deferred.promise;
        }
        $scope.resolveGoalDisplay = function() {
          for (var i = 0; i < $scope.goals.length; i++) {
            var goal = $scope.goals[i];

            goal.title = goal.name ;
            goal.max = goal.desiredValue;
            goal.width = evaluateWidth(goal);
            goal.colorClass = evaluateColorClass(goal);
            goal.proposedValue = goal.desiredValue;

            switch(goal.goalType) {
              case 'ASSIGNMENT':
                goal.maxDisplay = goal.desiredValue + '%';
                goal.progressText = 'Your score: ' + goal.calculatedValue + '%';
                if (goal.calculatedValue === -1) {
                  goal.progressText = 'Your score: Not Graded';
                }
                goal.maxPossible = '100' ;
                goal.aveValue = '75%';

                break;
              case 'BEHAVIOR':
                goal.maxDisplay = goal.desiredValue;
                goal.progressText = 'Incidents: ' + goal.calculatedValue;
                goal.aveValue = '3';
                //TODO Set the maxPossible for a goal to be a school property (GPA)
                goal.maxPossible = '50' ;
                break;
              case 'CUMULATIVE_GRADE':
                goal.maxDisplay = goal.desiredValue + '%';
                goal.progressText = 'Your grade: ' + goal.calculatedValue + '%';
                goal.aveValue = '83%';
                goal.maxPossible = '100' ;
                break;
              case 'ATTENDANCE':
                goal.maxDisplay = goal.desiredValue;
                goal.progressText = 'Your absences: ' + goal.calculatedValue;
                goal.aveValue = '3';
                goal.maxPossible = '50' ;
                //TODO this needs to be some function of number of days of school in that goal period
                break;
            }



            $scope.goals[i] = goal;
          }
        }

        function evaluateWidth(goal) {
          if (goal.calculatedValue === -1) {
            return '100';
          } else {
            var width = goal.calculatedValue / goal.max * 100;
            if (width > 100) {
              return 100;
            } else {
              if (width === 0) {
                return 2;
              }
              return width;
            }
          }
        }

        function evaluateColorClass(goal) {
          var danger = 'goal-danger';
          var warning = 'goal-warning';
          var success = 'goal-success';
          var unknown = 'goal-unknown';
          var performanceClasses = [danger, warning, success];

          //Extend this to work for all negative goal types
          if (goal.behaviorCategory === 'DEMERIT' || goal.goalType === 'ATTENDANCE') {
            performanceClasses.reverse();
          }

          if (goal.calculatedValue === -1) {
            return unknown;
          }

          if (goal.width < 33) {
            return performanceClasses[0];
          } else if (goal.width >= 33 && goal.width <= 67) {
            return performanceClasses[1];
          } else {
            return performanceClasses[2];
          }
        }

        resolveGoalDataAndDisplay();
      }
    };
  }]);
