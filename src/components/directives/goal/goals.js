'use strict';
angular.module('teacherdashboard')
  .directive('goals', ['$state', 'statebag', 'api', '$mdToast', function($state, statebag, api, mdToast) {
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
              console.log("SUCCESS");
              var index = $scope.goals.indexOf(goal);
              $scope.goals.splice(index,1);
            },
            function(error) {
              console.log("FAILURE");
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
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           apiGoal,
            function() {
              console.log("SUCCESS");
              showSimpleToast("Goal changed successfully");
            },
            function(error) {
              showSimpleToast("There was a problem modifying the goal");
              console.log("FAILURE");
            });


        }
      }
    };
  }]);
