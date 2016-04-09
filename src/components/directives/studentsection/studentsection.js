'use strict';
angular.module('teacherdashboard')
  .directive('studentsection', [ 'analytics','statebagApiManager' , 'api', '$compile','$timeout', '$mdToast','$window',
  function(analytics, statebagApiManager, api, $compile, $timeout, mdToast, $window) {
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
        scope.assignmentTypeWeights = null;
        var GA_PAGE_NAME = 'StudentSection';
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
        //The action button always shows if this is set on the data
        scope.toolbarAnimation = 'md-scale';
        scope.sectionGrade = {
          currentGrade: scope.section.grade,
          components: componentGrades
        };

        scope.resolveCurrentTermsFormula = function(formula) {
          if (formula.children && formula.children.length > 0) {
            for (var i = 0; i < formula.children.length; i++) {
              var newFormula = scope.resolveCurrentTermsFormula(formula.children[i]);
              if (newFormula) {
                return newFormula;
                break;
              }
            }
          } else if (formula.startDate && formula.endDate) {
            var start = $window.moment(formula.startDate);
            var end = $window.moment(formula.endDate);
            var now = $window.moment().startOf('day');
            if ((start.isSame(now) || start.isBefore(now)) && (end.isSame(now) || end.isAfter(now))) {
              return formula;
            }
          }
          return null;
        };
        scope.resolveAssignmentTypeWeights = function(formulaToUse) {
          if(!formulaToUse.assignmentTypeWeights) {
            return null;
          }
          var returnVal = [];
          angular.forEach(formulaToUse.assignmentTypeWeights, function(value, key) {
            var childArray = [];
            childArray.push(key);
            childArray.push(value);
            returnVal.push(childArray);
          });
          return returnVal;

        };
        scope.formulaToUse = scope.resolveCurrentTermsFormula(scope.section.gradeFormula);
        if(!scope.formulaToUse) {
          scope.formulaToUse = scope.section.gradeFormula;
        }
        scope.assignmentTypeWeights = scope.resolveAssignmentTypeWeights(scope.formulaToUse);

        scope.showAssignments = function() {
          analytics.sendEvent(GA_PAGE_NAME, analytics.SHOW_ASSIGNMENTS, analytics.ASSIGNMENT_LABEL);
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
        };

        scope.myData = scope.sectionGrade.components;

        $timeout(function() {
          scope.gage = new $window.JustGage({
            id: 'gauge-'+ scope.section.id + '-section',
            value: scope.section.goal.calculatedValue,
            min: 50,
            max: 100,
            textRenderer: statebagApiManager.resolveGrade,
            valueMinFontSize: 50,
            hideMinMax: true,
            levelColors: [
              '#F44366',
              '#FFEB3B',
              '#4CAF50'
            ]
          });
        }, 50);
      }
    };
  }]);
