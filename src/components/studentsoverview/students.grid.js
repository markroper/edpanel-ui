'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', [function() {
    return {
      scope: {
        studentsData: '='
      },
      restrict: 'E',
      templateUrl: 'components/studentsoverview/students.grid.html',
      replace: true
    };
  }]);