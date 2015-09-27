'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', 'api', '$mdDialog', function($state, statebag, api, $mdDialog) {
    return {
      scope: {
        studentsData: '=',
        showFilter: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope) {
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student', { schoolId: $state.params.schoolId, studentId: student.id });
        };
        $scope.showBehaviorDialog = function(ev, student) {
          $scope.student = student;
          $scope.api = api;
          $mdDialog.show({
            controller: DialogController,
            templateUrl: api.basePrefix + '/components/directives/studentsoverview/behavior-dialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            scope: $scope.$new(),
            clickOutsideToClose:true
          })
          .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
          }, function() {
            $scope.status = 'You cancelled the dialog.';
          });
        };
      }
    };
  }]);

function DialogController($scope, $mdDialog) {
  $scope.behaviorDataPromise = 
    $scope.api.studentBehaviors.get({ studentId: $scope.student.id }).$promise;

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };
}