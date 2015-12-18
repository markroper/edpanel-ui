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
        console.log(scope.students);
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
