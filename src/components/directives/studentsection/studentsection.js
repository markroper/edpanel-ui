'use strict';
angular.module('teacherdashboard')
  .directive('studentsection', [ '$window', 'api', '$compile','$timeout', function($window, api, $compile, $timeout) {
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
        scope.sectionGrade = {
          currentGrade: "B+",
          components: [
            { type: "Homework", grade: "B+" },
            { type: "Quizes", grade: "A+" },
            { type: "Tests", grade: "C+" },
            { type: "Final", grade: "B" }
          ]
        };
        scope.editGoal = function(section) {
          //Call api to edit the goal
          section.goal.editActive = true;

        };

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

        function gradeEval(val) {
          return "B+";
        }

        $timeout(function() {
          var g = new JustGage({
            id: "gauge-"+ scope.section.nameId,
            value: "87",
            min: 0,
            max: 100,
            textRenderer: gradeEval,
            valueMinFontSize: 80,
            gaugeWidthScale: 0.5
          });
        });
      }
    };
  }]);
