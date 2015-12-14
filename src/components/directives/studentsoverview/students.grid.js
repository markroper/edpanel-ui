'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window) {
    return {
      scope: {
        studentsData: '=',
        showFilter: '=',
        cellWidth: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studentsoverview/students.grid.html',
      replace: true,
      controller: function($scope) {
        var behaviorCalendarHtml = '<div flex="100" class="slidercontainer chorocontainer"><chorocalendar slide-closed="hideTray" calendar-data-promise="behaviorDataPromise"></chorocalendar></div>';
        var hwCompletionChartHtml = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" key-to-x="weekEnding" key-to-y="score" date-time-data-promise="dateTimeDataPromise"></datetimechart></div>';
        var attendanceTableHtml = '<div flex="100" class="slidercontainer"><attendancetable slide-closed="hideTray" attendance-data-promise="attendanceDataPromise"></attendancetable></div>';
        var gpaChartTemplate = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" key-to-x="calculationDate" key-to-y="score" date-time-data-promise="gpaDataPromise"></datetimechart></div>';

        //Use the name as the sort field for the list, to start
        $scope.order = 'name';
        $scope.sortElement = null;
        $scope.setOrder = function(ev, keyToUse) {
          var el = angular.element(ev.target);
          if($scope.sortElement) {
            $scope.sortElement.removeClass('desc');
            $scope.sortElement.removeClass('asc');
          }
          if($scope.order === keyToUse) {
            keyToUse = '-' + keyToUse;
            el.addClass('desc');
          } else {
            el.addClass('asc');
          }
          $scope.sortElement = el;
          $scope.order = keyToUse;
        };

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
