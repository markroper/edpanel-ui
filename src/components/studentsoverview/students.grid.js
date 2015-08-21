'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', function($state) {
    return {
      scope: {
        studentsData: '='
      },
      restrict: 'E',
      templateUrl: 'components/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope) {
        $scope.goToStudent = function() {
          $state.go('app.student');
        };
      }
    };
  }]);