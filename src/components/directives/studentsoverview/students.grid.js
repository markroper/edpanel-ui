'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', function($state, statebag, api, $mdDialog, $compile, $timeout) {
    return {
      scope: {
        studentsData: '=',
        showFilter: '=',
        cellWidth: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope, $element) {
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student', { schoolId: $state.params.schoolId, studentId: student.id });
        };
        $scope.showBehaviorDialog = function(ev, student) {
          $scope.student = student;
          $scope.api = api;
          if($scope.choroScope) {
            $scope.choroScope.$destroy();
            $scope.choroScope = null;
            if($scope.choroCal) {
              $scope.choroCal.removeClass('chorocontainer');
              $scope.choroCal.addClass('oldchorocontainer');
              var oldElem = $scope.choroCal;
              $scope.choroCal = null;
              //After we've animated the previous chorocal away, actually remove it
              $timeout(function(){
                oldElem.remove();
              }, 250);
            }
          }
          $scope.choroScope = $scope.$new(true);
          $scope.choroScope.behaviorDataPromise = 
            api.studentBehaviors.get({ studentId: student.id }).$promise;
          $scope.choroCal = $compile('<div flex="100" class="chorocontainer"><chorocalendar calendar-data-promise="behaviorDataPromise"></chorocalendar></div>')($scope.choroScope);
          $scope.choroCal.insertAfter(angular.element(ev.target).parent().parent());
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