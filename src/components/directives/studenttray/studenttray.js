'use strict';
angular.module('teacherdashboard')
  .directive('studentTray', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window) {
    return {
      scope: {
        studentsData: '=',
        showFilter: '=',
        cellWidth: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studenttray/studenttray.html',
      replace: true,
      controller: function($scope) {
        console.log($scope.studentsData);
   $scope.showMoreStudents = true;
        $scope.limit = 30;
        $scope.increaseLimit = function() {
          if ($scope.studentsData && $scope.limit < $scope.studentsData.length) {
            $scope.limit += 30;
          } else {
            $scope.showMoreStudents = false;
          }
        };

        var cell;
        console.log("RUNNING");
        console.log($scope.studentsData);
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
            if(cell) {
              cell.removeClass('deployed');
            }
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
            if(template === behaviorCalendarHtml) {
              //Cache the isolated scope variables needed for the chorocalendar directive
              $scope.choroScope.behaviorDataPromise =
                api.studentBehaviors.get({ studentId: student.id }).$promise;
            } else if(template === attendanceTableHtml) {
              $scope.choroScope.attendanceDataPromise =
                api.studentAttendance.get({ schoolId: statebag.school.id, studentId: student.id }).$promise;
            } else if(template === hwCompletionChartHtml) {
              $scope.choroScope.dateTimeDataPromise = api.studentHwRates.get({
                  studentId: student.id,
                  startDate: moment(statebag.currentYear.startDate).format('YYYY-MM-DD'),
                  endDate: moment(statebag.currentYear.endDate).format('YYYY-MM-DD')
                }).$promise;
            } else if(template === gpaChartTemplate) {
              $scope.choroScope.gpaDataPromise = api.gpasOverTime.get(
                { studentId: student.id }
              ).$promise;
            }
            $scope.choroScope.hideTray = $scope.hideTray;
            $scope.choroCal = $compile(template)($scope.choroScope);
            cell = angular.element(ev.target).closest('.table-cell');
            cell.addClass('deployed');
            angular.element(ev.target).closest('.table-row').after($scope.choroCal);
          } else {
            $scope.hideTray(ev, student);
          }
        };
        $scope.showBehaviorTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowBehavior', 'Open Behavior Tray');
          $scope.showTray(ev, student, behaviorCalendarHtml);
        };
        $scope.showHomeworkTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowHomework', 'Open HW Completion Tray');
          $scope.showTray(ev, student, hwCompletionChartHtml);
        };
        $scope.showGpaTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowGpa', 'Open GPA Tray');
          $scope.showTray(ev, student, gpaChartTemplate);
        };
        $scope.showAttendanceTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowAttendance', 'Open Attendance Tray');
          $scope.showTray(ev, student, attendanceTableHtml);
        };
      }
    };
  }]);
