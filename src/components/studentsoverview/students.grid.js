'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', function($state, statebag) {
    return {
      scope: {
        studentsData: '='
      },
      restrict: 'E',
      templateUrl: 'components/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope) {
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student');
        };
      }
    };
  }]);