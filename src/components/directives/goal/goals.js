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
        $scope.deleteGoal = function(goal) {
          api.editStudentGoal.delete(
            { studentId: goal.student.id,
              goalId: goal.id},
            function() {
              console.log("SUCCESS");
              var index = $scope.goals.indexOf(goal);
              $scope.goals.splice(index,1);
              //TODO should show a toast
            },
            function(error) {
              console.log("FAILURE");
              //TODO should show a toast
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
            var apiGoal = jQuery.extend(true, {}, goal);
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
          console.log(goal);
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           apiGoal,
            function() {
              console.log("SUCCESS");
              //TODO should show a toast
            },
            function(error) {
              console.log("FAILURE");
              //TODO should show a toast
            });


        }
      }
    };
  }]);
