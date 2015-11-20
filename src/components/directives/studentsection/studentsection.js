'use strict';
angular.module('teacherdashboard')
  .directive('studentsection', [ '$window','statebagApiManager' , 'api', '$compile','$timeout', '$mdToast', function($window, statebagApiManager, api, $compile, $timeout, mdToast) {
    return {
      scope: {
        section: '=',
        assignmentDataPromise: '=',
        sectionGradePromise: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studentsection/studentsection.html',
      replace: true,
      link: function(scope, elem) {
        var scatterPlotHtml = '<scatterplot chart-data-promise="section.assignmentsPromise" section="section"></scatterplot>';
        var $assignmentsContainer = angular.element(elem).find('.assignment-scores');
        var $assignmentArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';
        var SLIDE_OPEN_CLASS = 'slide-open-assignments';
        var SLIDE_CLOSED_CLASS = 'slide-closed-assignments';
        //Set grade and component scores
        var componentGrades = [];
        angular.forEach(scope.section.currentCategoryGrades, function(value, key) {
          this.push({ 'type': key.toLowerCase(), 'score': value });
        }, componentGrades);
        scope.sectionGrade = {
          currentGrade: scope.section.grade,
          components: componentGrades
        };
        scope.editGoal = function(section) {
          //Call api to edit the goal
          console.log(section.editActive);
          section.editActive = true;

        };

        scope.proposeEdit = function(section) {
          section.goal.desiredValue = section.goal.proposedValue
          var datifyGoal = function(goal) {
            var apiGoal = angular.extend({}, goal);
            delete apiGoal.proposedValue;
            delete apiGoal.nameId;
            return apiGoal;

          }
          var showSimpleToast = function(msg) {
            mdToast.show(
              mdToast.simple()
                .content(msg)
                .action('OK')
                .hideDelay(2000)
            );
          };

          var goal = datifyGoal(section.goal);
          section.editActive = false;
          goal.desiredValue = section.goal.proposedValue;
          api.editStudentGoal.patch(
            { studentId: goal.student.id,
              goalId: goal.id},
            goal,
            function() {
              //TODO FIX DISPLAY ONCE THIS CHANGES?
              scope.gage.refresh(goal.calculatedValue, goal.desiredValue);
              showSimpleToast("Goal changed successfully");
            },
            function(error) {
              showSimpleToast("There was a problem modifying the goal");

            });


        }

        scope.showAssignments = function() {
          if($assignmentsContainer.children().length === 0) {
            $assignmentsContainer.append($compile(scatterPlotHtml)(scope));
          }
          $assignmentsContainer.toggleClass(SLIDE_OPEN_CLASS);
          $assignmentsContainer.toggleClass(SLIDE_CLOSED_CLASS);
          if($assignmentArrowIcon.hasClass(ROTATE)) {
            $assignmentArrowIcon.removeClass(ROTATE);
            $assignmentArrowIcon.addClass(ROTATE_COUNTERWISE);
          } else {
            $assignmentArrowIcon.removeClass(ROTATE_COUNTERWISE);
            $assignmentArrowIcon.addClass(ROTATE);
          }

        }

        scope.myData = scope.sectionGrade.components;

        $timeout(function() {
          scope.gage = new JustGage({
            id: "gauge-"+ scope.section.goal.nameId,
            value: scope.section.goal.calculatedValue,
            min: 0,
            max: scope.section.goal.desiredValue,
            textRenderer: statebagApiManager.resolveGrade,
            valueMinFontSize: 80,
            gaugeWidthScale: 0.5,
            levelColors: [
              "#F44366",
              "#FFEB3B",
              "#4CAF50"
            ]
          });
        });
      }
    };
  }]);
