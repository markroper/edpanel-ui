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
        $scope.hideBehaviorTray = function() {
          //Null out the active student
          $scope.student = null;
          //Bury the body, hide the evidence
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
              }, 300);
            }
          }
        };
        $scope.showBehaviorTray = function(ev, student) {
          if(!$scope.student || $scope.student.id !== student.id) {
            //Hide other dialog, if shown...
            $scope.hideBehaviorTray(ev, student);
            $scope.student = student;
            $scope.choroScope = $scope.$new(true);
            //Cache the isolated scope variables needed for the chorocalendar directive
            $scope.choroScope.behaviorDataPromise = 
              api.studentBehaviors.get({ studentId: student.id }).$promise;
            $scope.choroScope.hideBehaviorTray = $scope.hideBehaviorTray;
            $scope.choroCal = $compile('<div flex="100" class="chorocontainer"><chorocalendar slide-closed="hideBehaviorTray" calendar-data-promise="behaviorDataPromise"></chorocalendar></div>')($scope.choroScope);
            angular.element(ev.target).parent().parent().after($scope.choroCal);
          } else {
            $scope.hideBehaviorTray(ev, student);
          }
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