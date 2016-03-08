'use strict';
angular.module('teacherdashboard')
  .directive('studentGrid', ['$state', 'statebag', 'api','$compile', '$timeout', 'analytics', 'consts','$window',
  function($state, statebag, api, $compile, $timeout, analytics, consts, $window) {
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
        var PAGENAME = 'Student List';
        var GPA = 'GPA';
        var BEHAVIOR = 'Behavior';
        var HOMEWORK_COMPLETION = 'Homework Completion';
        var GENDER = 'Gender';
        var RACE = 'Race';
        var ETHNICITY = 'Ethnicity';
        var ABSENCES = 'Absences';
        var ELL = 'ELL';
        var SPED = 'SPED';
        var behaviorCalendarHtml = '<div flex="100" class="slidercontainer chorocontainer"><chorocalendar slide-closed="hideTray" calendar-data-promise="behaviorDataPromise"></chorocalendar></div>';
        var hwCompletionChartHtml = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" y-data-label="Homework Completion" key-to-x="weekEnding" key-to-y="score" date-time-data-promise="dateTimeDataPromise"></datetimechart></div>';
        var attendanceTableHtml = '<div flex="100" class="slidercontainer"><attendancetable slide-closed="hideTray" attendance-data-promise="attendanceDataPromise"></attendancetable></div>';
        var gpaChartTemplate = '<div flex="100" class="slidercontainer datetimechartcontainer"><datetimechart slide-closed="hideTray" y-data-label="GPA" key-to-x="calculationDate" key-to-y="score" date-time-data-promise="gpaDataPromise"></datetimechart></div>';
        //Use the name as the sort field for the list, to start
        $scope.order = 'name';
        $scope.sortElement = null;

        $scope.kpiTallies = {};
        var RED_CLASS = '40-50';
        var SECOND_RED_CLASS = '50-60';
        var YELLOW_CLASS = '70-80';
        var GREEN_CLASS = '90-100';
        //$scope.$watchCollection('filteredStudentData', function(newStudentData) {
        $scope.$watch('filteredStudentData', function(newStudentData) {
          if(newStudentData && newStudentData.reduce) {
            $scope.kpiTallies = newStudentData.reduce(function (returnObj, student) {
                if (GREEN_CLASS === student.homeworkClass) {
                  returnObj.homework[0]++;
                } else if (YELLOW_CLASS === student.homeworkClass) {
                  returnObj.homework[1]++;
                } else if (RED_CLASS === student.homeworkClass) {
                  returnObj.homework[2]++;
                }
                if (GREEN_CLASS === student.gpaClass) {
                  returnObj.gpa[0]++;
                } else if (YELLOW_CLASS === student.gpaClass) {
                  returnObj.gpa[1]++;
                } else if (SECOND_RED_CLASS === student.gpaClass) {
                  returnObj.gpa[2]++;
                }
                if (GREEN_CLASS === student.behaviorClass) {
                  returnObj.behavior[0]++;
                } else if (YELLOW_CLASS === student.behaviorClass) {
                  returnObj.behavior[1]++;
                } else if (RED_CLASS === student.behaviorClass) {
                  returnObj.behavior[2]++;
                }
                if (GREEN_CLASS === student.attendanceClass) {
                  returnObj.attendance[0]++;
                } else if (YELLOW_CLASS === student.attendanceClass) {
                  returnObj.attendance[1]++;
                } else if (RED_CLASS === student.attendanceClass) {
                  returnObj.attendance[2]++;
                }
                return returnObj;
              },
              {behavior: [0, 0, 0], homework: [0, 0, 0], attendance: [0, 0, 0], gpa: [0, 0, 0]}
            );
          }
        }, true);

        //FILTER RELATED
        $scope.showfilters = false;
        $scope.filter = null;
        $scope.filters = [GPA, BEHAVIOR, HOMEWORK_COMPLETION,
          GENDER, RACE, ETHNICITY, ELL, SPED, ABSENCES];
        $scope.currentFilters = {};
        /**
         * When a user types in values for a filter, this method is called back to update
         * the filter values, which triggers a student list filter via a digest loop.
         *
         * @param filter  - The filter object from the child directive calling back
         * @param filterValues The values set on the filter
         * @param filterStrategy The filter strategy, valid values are 'LIST' and 'RANGE'
         * @param newVal The newly changed value
         * @param oldVal The previous value
         */
        $scope.filterAdded = function(filter, filterValues, filterStrategy) {
          $scope.currentFilters[filter.type].values = filterValues;
          $scope.currentFilters[filter.type].strategy = filterStrategy;
        };
        $scope.removeFilter = function(filter) {
          delete $scope.currentFilters[filter];
        };
        $scope.toggleFilters = function() {
          analytics.sendEvent(PAGENAME, analytics.TOGGLE_FILTER, analytics.FILTER);
          $scope.showFilters = !$scope.showFilters;
        };
        $scope.addFilter = function() {
          if(!$scope.currentFilters[$scope.filter] && $scope.filter) {
            $scope.currentFilters[$scope.filter] = { type: $scope.filter };

            //Analytics code lives here
            var label = $scope.filter.toUpperCase();
            if ($scope.filter === HOMEWORK_COMPLETION) {
              label = analytics.HOMEWORK_LABEL;

            } else if  ($scope.filter === ABSENCES) {
              label = analytics.ATTENDANCE_LABEL;
            }
            analytics.sendEvent(PAGENAME, analytics.ADD_FILTER, label);
            //END ANALYTICS CODE

          }
        };
        var genderMapping = {
          'MALE': 'Male',
          'FEMALE': 'Female'
        };

        var ellMapping = {
          true: 'ELL',
          false: 'Non-ELL',
          null: 'Unknown'
        };

        var spedMapping = {
          true: 'SPED',
          false: 'Non-SPED',
          null: 'Unknown'
        };

        /**
         * Throws an exception if a candidate value does not match the filterConditions where the filter conditions
         * are a list of valid values.
         * @param filterConditions
         * @param candidate
         */
        var evalListCondition = function(filterConditions, candidate) {
          if (filterConditions && filterConditions.length > 0) {
            var match = false;
            for(var i = 0; i < filterConditions.length; i++) {
              if(filterConditions[i].name === candidate) {
                match = true;
                break;
              }
            }
            if(!match) {
              throw BreakException;
            }
          }
        };
        /**
         * Throws an exception if a candidate value does not match the filterConditions where
         * the filter conditions contain a numeric min and or max value.
         * @param filterConditions
         * @param candidate
         */
        var evalRangeCondition = function(filterConditions, candidate) {
          if(filterConditions) {
            if (filterConditions.min && (candidate < filterConditions.min || !candidate)) {
              throw BreakException;
            }
            if (filterConditions.max && (candidate > filterConditions.max || !candidate)) {
              throw BreakException;
            }
          }
        };

        var BreakException= {};
        /**
         * The filter function called by ng-repeat on the student list to filter down the list. For each of the
         * current filters the user has selected, student instances are compared against filter value and if it passes,
         * the next filter is moved on to. If a filter condition is not met, false is immediately returned and the
         * additional filters are not evaluated.  Filters are AND'd together in this manner.
         *
         * @param student
         * @returns {boolean}
         */
        $scope.filterStudents = function(student) {
          try {
            angular.forEach($scope.currentFilters, function (value, key) {
              //Perform the filter
              if (key === GPA) {
                evalRangeCondition(value.values, student.gpa);
              } else if (key === BEHAVIOR) {
                evalRangeCondition(value.values, student.behavior);
              } else if (key === HOMEWORK_COMPLETION) {
                evalRangeCondition(value.values, student.homework);
              } else if (key === ABSENCES) {
                evalRangeCondition(value.values, student.attendance);
              } else if (key === GENDER) {
                evalListCondition(value.values, genderMapping[student.student.gender]);
              } else if (key === RACE) {
                evalListCondition(value.values, consts.raceMap[student.student.federalRace]);
              } else if (key === ETHNICITY) {
                evalListCondition(value.values, consts.ethnicityMap[student.student.federalEthnicity]);
              } else if(key === ELL) {
                evalListCondition(value.values, ellMapping[student.student.ell]);
              } else if(key === SPED) {
                evalListCondition(value.values, spedMapping[student.student.sped]);
              }
            });
          } catch (e) {
            return false;
          }
          return true;
        };

        //SORT RELATED
        $scope.setOrder = function(ev, keyToUse) {
          analytics.sendEvent(PAGENAME, analytics.STUDENT_SORT, keyToUse.toUpperCase());
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

        //TRAY RELATED
        var cell;
        $scope.goToStudent = function(student) {
          statebag.currentStudent = student;
          analytics.sendEvent(PAGENAME, analytics.OPEN_STUDENT, analytics.STUDENT_LABEL);
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
                  startDate: $window.moment(statebag.currentYear.startDate).format('YYYY-MM-DD'),
                  endDate: $window.moment(statebag.currentYear.endDate).format('YYYY-MM-DD')
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
          analytics.sendEvent(PAGENAME, analytics.SHOW_BEHAVIOR, analytics.BEHAVIOR_LABEL);
          $scope.showTray(ev, student, behaviorCalendarHtml);
        };
        $scope.showHomeworkTray = function(ev, student) {
          analytics.sendEvent(PAGENAME, analytics.SHOW_HOMEWORK, analytics.HOMEWORK_LABEL);
          $scope.showTray(ev, student, hwCompletionChartHtml);
        };
        $scope.showGpaTray = function(ev, student) {
          analytics.sendEvent(PAGENAME, analytics.SHOW_GPA, analytics.GPA_LABEL);
          $scope.showTray(ev, student, gpaChartTemplate);
        };
        $scope.showAttendanceTray = function(ev, student) {
          analytics.sendEvent(PAGENAME, analytics.SHOW_ATTENDANCE, analytics.ATTENDANCE_LABEL);
          $scope.showTray(ev, student, attendanceTableHtml);
        };
      }
    };
  }]);
