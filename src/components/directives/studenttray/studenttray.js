'use strict';
angular.module('teacherdashboard')
  .directive('studentTray', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window','authentication',
  function($state, statebag, api, $mdDialog, $compile, $timeout, $window, authentication) {
    return {
      scope: {
        studentsData: '=',
        showFilter: '=',
        cellWidth: '@',
        sectionId: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studenttray/studenttray.html',
      replace: true,
      controller: function($scope) {
        var behaviorCalendarHtml = '<div flex="100" class="slidercontainer chorocontainer"><chorocalendar slide-closed="hideTray" calendar-data-promise="behaviorDataPromise"></chorocalendar></div>';
        var hwCompletionChartHtml = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" key-to-x="weekEnding" key-to-y="score" date-time-data-promise="dateTimeDataPromise"></datetimechart></div>';
        var attendanceTableHtml = '<div flex="100" class="slidercontainer"><attendancetable slide-closed="hideTray" attendance-data-promise="attendanceDataPromise"></attendancetable></div>';
        var gpaChartTemplate = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" key-to-x="calculationDate" key-to-y="score" date-time-data-promise="gpaDataPromise"></datetimechart></div>';
        $scope.showMoreStudents = true;
        $scope.limit = 100;

        var cell;
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          $state.go('app.student', { schoolId: $state.params.schoolId, studentId: student.id });
        };
        $scope.showTray = function(ev, student, template) {
          if(!$scope.student || $scope.student.id !== student.id || $scope.currTemplate !== template) {
            console.log($scope.sectionId);
            //Hide other dialog, if shown...
            $scope.hideTray(ev, student);
            $scope.student = student;
            $scope.currTemplate = template;
            $scope.choroScope = $scope.$new(true);
            if(template === behaviorCalendarHtml) {
              //Cache the isolated scope variables needed for the chorocalendar directive
              console.log($scope.studentsData);
              $scope.choroScope.behaviorDataPromise =
                api.studentDemerits.get({
                  schoolId: statebag.school.id,
                  yearId: statebag.currentYear.id,
                  termId: statebag.currentTerm.id,
                  teacherId: authentication.identity().id,
                  studentId: $scope.student.id
                  }, {}).$promise
            } else if(template === attendanceTableHtml) {
              $scope.choroScope.attendanceDataPromise =
                api.studentSectionAttendance.get({ sectionId: $scope.sectionId ,schoolId: statebag.school.id, studentId: student.id }).$promise;
            } else if(template === hwCompletionChartHtml) {
              $scope.choroScope.dateTimeDataPromise = api.studentSectionHwRates.get({
                studentId: student.id,
                sectionId: $scope.sectionId
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
        $scope.showBehaviorTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowBehavior', 'Open Behavior Tray');
          $scope.showTray(ev, student, behaviorCalendarHtml);
        };
        $scope.showHomeworkTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowHomework', 'Open HW Completion Tray');
          $scope.showTray(ev, student, hwCompletionChartHtml);
        };
        $scope.showAttendanceTray = function(ev, student) {
          $window.ga('send', 'event', 'Home', 'ShowAttendance', 'Open Attendance Tray');
          $scope.showTray(ev, student, attendanceTableHtml);
        };

      }
    };
  }]);
