'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', 'api', function($state, statebag, api) {
    return {
      scope: {
        studentsData: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope) {
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student', { schoolId: $state.params.schoolId, studentId: student.id });
        };
      }
    };
  }]);