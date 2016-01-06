'use strict';
angular.module('teacherdashboard')
  .directive('sectionGrid', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window','authentication',"$q",
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window, authentication, $q) {
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
        var $studentContainer = angular.element(elem).find('.student-slide');
        var $studentArrowIcon = angular.element(elem).find('.arrow-icon');
        var ROTATE = 'rotate';
        var ROTATE_COUNTERWISE = 'rotateCounterwise';
        var SLIDE_OPEN_CLASS = 'slide-open-students';
        var SLIDE_CLOSED_CLASS = 'slide-closed-students';

        scope.showStudents = function() {
          $window.ga('send', 'event', 'StudentSection', 'ShowAssignments', 'Show Assignments');
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
