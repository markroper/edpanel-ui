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
        var behaviorCalendarHtml = '<div flex="100" class="slidercontainer chorocontainer"><chorocalendar slide-closed="hideTray" calendar-data-promise="behaviorDataPromise"></chorocalendar></div>';
        var hwCompletionChartHtml = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" data-promise="hwDataPromise"></datetimechart></div>';
        
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student', { schoolId: $state.params.schoolId, studentId: student.id });
        };
        $scope.hideTray = function() {
          //Null out the active student
          $scope.student = null;
          $scope.currTemplate = null;
          //Bury the body, hide the evidence
          if($scope.choroScope) {
            $scope.choroScope.$destroy();
            $scope.choroScope = null;
            if($scope.choroCal) {
              $scope.choroCal.removeClass('slidercontainer');
              $scope.choroCal.addClass('oldslidercontainer');
              var oldElem = $scope.choroCal;
              $scope.choroCal = null;
              //After we've animated the previous chorocal away, actually remove it
              $timeout(function(){
                oldElem.remove();
              }, 300);
            }
          }
        };
        $scope.showTray = function(ev, student, template) {
          if(!$scope.student || $scope.student.id !== student.id || $scope.currTemplate !== template) {
            //Hide other dialog, if shown...
            $scope.hideTray(ev, student);
            $scope.student = student;
            $scope.currTemplate = template;
            $scope.choroScope = $scope.$new(true);
            //Cache the isolated scope variables needed for the chorocalendar directive
            $scope.choroScope.behaviorDataPromise = 
              api.studentBehaviors.get({ studentId: student.id }).$promise;
            $scope.choroScope.hideTray = $scope.hideTray;
            $scope.choroCal = $compile(template)($scope.choroScope);
            angular.element(ev.target).parent().parent().after($scope.choroCal);
          } else {
            $scope.hideTray(ev, student);
          }
        }
        $scope.showBehaviorTray = function(ev, student) {
          $scope.showTray(ev, student, behaviorCalendarHtml);
        };
        $scope.showHomeworkTray = function(ev, student) {
          $scope.showTray(ev, student, hwCompletionChartHtml);
        }
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