'use strict';
angular.module('teacherdashboard')
  .directive('sectionGrid', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window) {
    return {
      scope: {
        sectionsData: '=',
        showFilter: '=',
        cellWidth: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/sectiongrid/sections.grid.html',
      replace: true,
      controller: function($scope) {
        console.log("LOADING DIRECTIVE");
        $scope.showMoreStudents = true;
        $scope.limit = 30;

        $scope.getAverageGrade = function(section) {
          var total = 0;
          for (var i = 0 ; i < section.grades.length; i++) {
            total += section.grades[i].grade;
          }
          console.log(total);
          return total/section.grades.length;
        }



      }
    };
  }]);
