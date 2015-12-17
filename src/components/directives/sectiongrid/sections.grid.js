'use strict';
angular.module('teacherdashboard')
  .directive('sectionGrid', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window) {
    return {
      scope: {
        section: '=',
        students: '=',
        showFilter: '=',
        cellWidth: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/sectiongrid/sections.grid.html',
      replace: true,
      link: function(scope, elem) {
        console.log(scope.students);
        var scatterPlotHtml = '<student-grid students-data="students" show-filter="showFilter" cellWidth="20"></student-grid>';
        var $assignmentsContainer = angular.element(elem).find('.assignment-scores');
        var $assignmentArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';
        var SLIDE_OPEN_CLASS = 'slide-open-assignments';
        var SLIDE_CLOSED_CLASS = 'slide-closed-assignments';
        scope.showStudents = function() {
          $window.ga('send', 'event', 'StudentSection', 'ShowAssignments', 'Show Assignments');
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
      },
      controller: function($scope) {

        console.log("LOADING DIRECTIVE");
        console.log($scope.sectionData);
        console.log($scope.section);
        $scope.showMoreStudents = true;
        $scope.limit = 30;
        function getAverageGrade(section) {
          var total = 0;
          for (var i = 0 ; i < section.grades.length; i++) {
            total += section.grades[i].grade;
          }
          console.log(total);
          return total/section.grades.length;
        }
        $scope.section['averageGrade'] = getAverageGrade($scope.section);
        console.log($scope.section);



      }
    };
  }]);
