'use strict';
angular.module('teacherdashboard')
  .directive('sectionGrid', ['$state', 'statebag', 'api','$compile', '$timeout', 'analytics',
  function($state, statebag, api, $compile, $timeout, analytics) {
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
        var GA_PAGE_NAME = 'Teacher Dashboard';
        var $studentContainer = angular.element(elem).find('.student-slide');
        var $studentArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';
        var SLIDE_OPEN_CLASS = 'slide-open-students';
        var SLIDE_CLOSED_CLASS = 'slide-closed-students';

        scope.showStudents = function() {
          analytics.sendEvent(GA_PAGE_NAME,analytics.SHOW_STUDENTS,analytics.SHOW_STUDENTS);

          $studentContainer.toggleClass(SLIDE_OPEN_CLASS);
          $studentContainer.toggleClass(SLIDE_CLOSED_CLASS);
          if($studentArrowIcon.hasClass(ROTATE)) {
            $studentArrowIcon.removeClass(ROTATE);
            $studentArrowIcon.addClass(ROTATE_COUNTERWISE);
          } else {
            $studentArrowIcon.removeClass(ROTATE_COUNTERWISE);
            $studentArrowIcon.addClass(ROTATE);
          }
        };
      }
    };
  }]);
