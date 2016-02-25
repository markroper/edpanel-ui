'use strict';
angular.module('teacherdashboard')
  .directive('goal', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window','statebagApiManager',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window, statebagApiManager) {
    return {
      scope: {
        goal: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/goal/goal.html',
      replace: true,
      controller: function($scope) {

        $scope.tempGoal = {
          name: '',
          behaviorType: '',
          desiredValue: '100',
          goalType: '',
          startDate: '',
          endDate: '',
          sectionName: ''
        };
        $scope.sectionsResolved = false;
        $scope.clearGoal = angular.extend({},$scope.tempGoal);
        $scope.behaviorTypes = ['DEMERIT','MERIT'];

        var showSimpleToast = function(msg) {
          mdToast.show(
            mdToast.simple()
              .content(msg)
              .action('OK')
              .hideDelay(2000)
          );
        };

        $scope.clearDialog = function() {
          $mdDialog.hide();
          $scope.tempGoal = angular.extend({},$scope.clearGoal);
        };

        $scope.handleCreateGoalClick = function(ev)  {
          $scope.sections = statebag.sections;
          $mdDialog.show({
            scope: $scope.$new(),
            student: statebag.currentStudent,
            templateUrl: api.basePrefix + '/components/directives/goal/goalCreate.html',
            parent: angular.element($document.prop( 'body' )),
            targetEvent: ev,
            clickOutsideToClose:true
          });
        };

        $scope.setGoalType = function(goalType) {
          $scope.tempGoal = angular.extend({},$scope.clearGoal);
          $scope.tempGoal.goalType = goalType;
        };

        $scope.deleteGoal = function(goal) {
          api.editStudentGoal.delete(
            { studentId: goal.student.id,
              goalId: goal.id},
            function() {
              var index = $scope.goals.indexOf(goal);
              $scope.goals.splice(index,1);
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
          console.log(goal);
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
          };
          var apiGoal = datifyGoal(goal);
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
           apiGoal,
            function() {
              $scope.resolveGoalDisplay(true);
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
              levelColors: [
                '#F44366',
                '#FFEB3B',
                '#4CAF50'
              ]
            });
          }

            goal.title = goal.name ;
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
