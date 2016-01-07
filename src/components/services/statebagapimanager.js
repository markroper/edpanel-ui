'use strict';
angular.module('teacherdashboard')
.service('statebagApiManager', ['statebag', '$q', 'api', '$window', function(statebag, $q, api, $window){
  var DATE_FORMAT = 'YYYY-MM-DD';
  //Returns a promise
  return {
    resolveCurrentYear: function() {
      var currentTime = new Date().getTime();
      for(var i = 0; i < statebag.school.years.length; i++) {
        if($window.moment(statebag.school.years[i].startDate).valueOf() <= currentTime ||
          $window.moment(statebag.school.years[i].endDate).valueOf() >= currentTime) {
          return statebag.school.years[i];
        }
        return statebag.school.years[statebag.school.years.length - 1];
      }
    },
    resolveGrade: function(input) {
      if(isNaN(input)) {
        return '--';
      }
      if(input > 94) {
        return 'A';
      } else if(input > 89) {
        return 'A-';
      } else if(input > 86) {
        return 'B+';
      } else if(input > 83) {
        return 'B';
      } else if(input > 79) {
        return 'B-';
      } else if(input > 76) {
        return 'C+';
      } else if(input > 73) {
        return 'C';
      } else if(input > 69) {
        return 'C-';
      } else if(input > 66) {
        return 'D+';
      } else if(input > 63) {
        return 'D';
      } else if(input > 59) {
        return 'D-';
      }
      return 'F';
    },
    resolveCurrentTerm: function() {
      var fullYearTerms = [];
      var currentTime = new Date().getTime();
      var termStart, termEnd;
      //Find a full year term whose date range encloses the current date
      for(var i = 0; i < statebag.currentYear.terms.length; i++) {
        var portion = statebag.currentYear.terms[i].portion;
        termStart = $window.moment(statebag.currentYear.terms[i].startDate).valueOf();
        termEnd = $window.moment(statebag.currentYear.terms[i].endDate).valueOf();
        if(portion && portion === 1) {
          fullYearTerms.push(statebag.currentYear.terms[i]);
          if(termStart <= currentTime && termEnd >= currentTime) {
            return statebag.currentYear.terms[i];
          }
        }
      }
      //Find any term whose date range encloses the current date
      for(var j = 0; j < statebag.currentYear.terms.length; j++) {
        termStart = $window.moment(statebag.currentYear.terms[j].startDate).valueOf();
        termEnd = $window.moment(statebag.currentYear.terms[j].endDate).valueOf();
        if(termStart <= currentTime && termEnd >= currentTime) {
          return statebag.currentYear.terms[j];
        }
      }
      //Fail, so return the last term in the array
      if(fullYearTerms.length === 0) {
        return statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
      }
    },
    resolveSectionGradeClass: function(sectionGrade) {
      //What shoudl these values be?
      var greenThreshold = 85;
      var yellowThreshold = 70;
      if(statebag.uiAttributes) {
        greenThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.green;
        yellowThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.yellow;
      }
      if(sectionGrade < yellowThreshold) {
        return '40-50';
      } else if(sectionGrade < greenThreshold) {
        return '70-80';
      } else {
        return '90-100';
      }
    },
    retrieveAndCacheSchool: function(schoolId) {
      var that = this;
      return api.school.get(
        { schoolId: schoolId },
        //Success callback
        function(data){
            statebag.school = data;
            statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
            statebag.currentTerm = that.resolveCurrentTerm();
        },
        //Error callback
        function(){
            console.log('failed to resolve the school!');
      }).$promise;
    },
    //TODO THIS IS ARBITARY I DONT KNOW WHAT THIS SHOULD BE
    resolveBehaviorClass: function(behaviorScore) {
    var greenThreshold = 7;
    var yellowThreshold = 20;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.green;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.yellow;
    }
    if(behaviorScore > yellowThreshold) {
      return '40-50';
    } else if(behaviorScore > greenThreshold) {
      return '70-80';
    } else {
      return '90-100';
    }
  },
    resolveAttendanceClass: function(attendanceScore) {
      return resolveAttendanceClass(attendanceScore);
  },
    resolveHomeworkClass: function(homeworkScore) {
      return resolveHomeworkClass(homeworkScore);
  },
    retrieveAndCacheStudentPerfData: function() {
      var deferred = $q.defer();

      //First, make sure we have UI attributes
      var uiAttrsDeferred = $q.defer();
      if(!statebag.uiAttributes) {
        api.uiAttributes.get(
          { schoolId: statebag.school.id },
          function(data) {
            statebag.uiAttributes = data;
            uiAttrsDeferred.resolve();
          },
          function(error) {
            console.log('Failed to resolve UI attrs ' + JSON.stringify(error));
            uiAttrsDeferred.reject(error);
          });
      } else {
        uiAttrsDeferred.resolve();
      }
      //Once we have UI attributes, resolve the data for the home page
      uiAttrsDeferred.promise.then(function() {
        var studentIds = [];
        var studentMap = {};
        for(var i = 0; i < statebag.students.length; i++) {
          studentIds.push(statebag.students[i].id);
          studentMap[statebag.students[i].id] = {
            student: statebag.students[i],
            name: statebag.students[i].name,
            id: statebag.students[i].id
          };
        }
        var attendanceDates = returnStartAndEndDate('attendance');
        //TODO: currently HW completion is term, driven and not customizable, change this?
        // var homeworkDates = returnStartAndEndDate('homework');
        var hwQuery = getHwQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate, studentIds);
        var attendanceQuery = getAttendanceQuery(attendanceDates.min, attendanceDates.max, studentIds);
        var studentDataPromises = [];

        //Get attendance & HW completion
        studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, hwQuery).$promise);
        studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, attendanceQuery).$promise);
        studentDataPromises.push(api.gpa.get({schoolId: statebag.school.id, id: studentIds}).$promise);
        studentDataPromises.push(api.studentsPrepScores.get({
          studentId: studentIds,
          startDate: $window.moment(statebag.currentYear.startDate).format(DATE_FORMAT),
          endDate: $window.moment().format(DATE_FORMAT)
        }).$promise);

        //When both the GPA and HW/Attendance queries have returned, populate the objects bound to the DOM!
        $q.all(studentDataPromises).then(function(responses) {
          //Handle the HW completion & attendance values
          responses[0].records.forEach(function(student){
            var stud = studentMap[student.values[0]];
            studentMap[student.values[0]] = resolveStudentScopeObject(stud, student.values);
          });

          //Update the attendance data for each student
          responses[1].records.forEach(function(student) {
            var studentAttendance = student.values;
            var pluckedStudent = studentMap[studentAttendance[0]];
            if (pluckedStudent) {
              pluckedStudent.attendance = studentAttendance[1];
              pluckedStudent.attendanceClass = resolveAttendanceClass(pluckedStudent.attendance);
              pluckedStudent.attendancePeriod = returnComponentPeriod('attendance');
            }

          });
          //Update the GPA
          for (var idKey in responses[2]) {
            if (responses[2].hasOwnProperty(idKey) &&
                !isNaN(idKey)) {
              var pluckedStudent = studentMap[idKey];
              if(pluckedStudent) {
                pluckedStudent.gpa = Math.round( responses[2][idKey] * 10 ) / 10;
                pluckedStudent.gpaClass = resolveGpaClass(pluckedStudent.gpa);
              }
            }
          }
          var maxEndDate = null;
          for (var student in responses[3]) {
            var score = responses[3][student];
            var pluckedStudent = studentMap[score.studentId];
            if(pluckedStudent && score.endDate &&
                ( !maxEndDate || maxEndDate <= $window.moment(score.endDate).valueOf())) {
              maxEndDate = $window.moment(score.endDate).valueOf();
              pluckedStudent.behavior = score.score;
              pluckedStudent.behaviorClass = resolveBehaviorClass(pluckedStudent.behavior);
              pluckedStudent.behaviorPeriod = returnComponentPeriod('behavior');
            }
          }
          var resolvedStudents = [];
          angular.forEach(studentMap, function(value) {
            this.unshift(value);
          }, resolvedStudents);
          statebag.lastFullRefresh = new Date().getTime();
          statebag.studentPerfData = resolvedStudents;
          deferred.resolve(statebag.studentPerfData);
        });
      });
      return deferred.promise;
    }
  };
  function resolveHomeworkClass(homeworkScore) {
    var greenThreshold = 0.92;
    var yellowThreshold = 0.89;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.homework.green/100;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.homework.yellow/100;
    }
    if(homeworkScore < yellowThreshold) {
      return '40-50';
    } else if(homeworkScore < greenThreshold) {
      return '70-80';
    } else {
      return '90-100';
    }
  }
   function resolveAttendanceClass(attendanceScore) {
    var greenThreshold = 3;
    var yellowThreshold = 6;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.attendance.green;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.attendance.yellow;
    }
    if(attendanceScore <= greenThreshold) {
      return '90-100';
    } else if(attendanceScore < yellowThreshold) {
      return '70-80';
    } else {
      return '40-50';
    }
  }


  /*
   * Supported component types: 'attendance', 'behavior'
   * Given a component type, return the UI settings' time period for that type
   *
  */
  function returnComponentPeriod(componentType) {
    var period = 'day';
    if(statebag.uiAttributes) {
      var component = statebag.uiAttributes.attributes.jsonNode[componentType];
      if(component) {
        period = component.period;
      }
    }
    return period;
  }
  /*
  * Supported component types: 'attendance', 'homework', 'gpa', 'behavior'.
  * Resolves the time period for the component type provided and returns an object
  * containing the minDate and maxDate for that component type as millis since the epoch
  */
  function returnStartAndEndDate(componentType) {
    //Given the component type, resolve the date range from the UI attrs
    var period = returnComponentPeriod(componentType);
    //Default date min/max will be the current day
    var dates = {};
    dates.min = new Date().getTime();
    dates.max = new Date().getTime();
    //Resolve the date range
    switch(period) {
      case 'day':
        break;
      case 'week':
        dates.min = $window.moment().day(0).valueOf();
        dates.max = $window.moment().valueOf();
        break;
      case 'month':
        dates.min = $window.moment().date(1).valueOf();
        dates.max = $window.moment().valueOf();
        break;
      case 'term':
        dates.min = $window.moment(statebag.currentTerm.startDate).valueOf();
        dates.max = $window.moment(statebag.currentTerm.endDate).valueOf();
        break;
      case 'year':
        dates.min = $window.moment(statebag.currentYear.startDate).valueOf();
        dates.max = $window.moment(statebag.currentYear.endDate).valueOf();
        break;
    }
    //Never let a max date be greater than the current date, duh
    if(dates.max > $window.moment().valueOf()) {
      dates.max = $window.moment().valueOf();
    }
    return dates;
  }
  function getStudentIdsExpression(studentIds) {
    return {
      'type': 'EXPRESSION',
      'leftHandSide': {
        'type': 'DIMENSION',
        'value': {
          'dimension': 'STUDENT',
          'field': 'ID'
        }
      },
      'operator': 'IN',
      'rightHandSide': {
        'type': 'LIST_NUMERIC',
        'value': studentIds
      }
    };
  }
  function getHwQuery(startDate, endDate, studentIds) {
    var hwQuery = {
      'aggregateMeasures': [
        {'measure':'HW_COMPLETION','aggregation':'AVG'}
      ],
      'fields':[
        {'dimension':'STUDENT','field':'ID'},
        {'dimension':'STUDENT','field':'Name'}
      ],
      'filter': {
        'type': 'EXPRESSION',
        'leftHandSide': getStudentIdsExpression(studentIds),
        'operator': 'AND',
        'rightHandSide': {
          'type': 'EXPRESSION',
          'leftHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                  'type': 'MEASURE',
                  'value': {
                      'measure': 'HW_COMPLETION',
                      'field': 'Due Date'
                  }
              },
              'operator': 'GREATER_THAN_OR_EQUAL',
              'rightHandSide': {
                  'type': 'DATE',
                  'value': startDate
              }
          },
          'operator': 'AND',
          'rightHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                  'type': 'MEASURE',
                  'value': {
                      'measure': 'HW_COMPLETION',
                      'field': 'Due Date'
                  }
              },
              'operator': 'LESS_THAN_OR_EQUAL',
              'rightHandSide': {
                  'type': 'DATE',
                  'value': endDate
              }
          }
        }
      }
    };
    return hwQuery;
  }

  function getAttendanceQuery(startDate, endDate, studentIds) {
    var query = {
      'aggregateMeasures': [
          {
              'measure': 'ATTENDANCE',
              'aggregation': 'SUM'
          }
      ],
      'fields': [
          {
              'dimension': 'STUDENT',
              'field': 'ID'
          }
      ],
      'filter': {
          'type': 'EXPRESSION',
          'leftHandSide': getStudentIdsExpression(studentIds),
          'operator': 'AND',
          'rightHandSide': {
            'type': 'EXPRESSION',
            'leftHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                'type': 'MEASURE',
                'value': {
                  'measure': 'ATTENDANCE',
                  'field': 'Type'
                }
              },
              'operator': 'EQUAL',
              'rightHandSide': {
                'type': 'STRING',
                'value': 'DAILY'
              }
            },
            'operator': 'AND',
            'rightHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                'type': 'EXPRESSION',
                'leftHandSide': {
                  'type': 'MEASURE',
                  'value': {
                    'measure': 'ATTENDANCE',
                    'field': 'Date'
                  }
                },
                'operator': 'GREATER_THAN_OR_EQUAL',
                'rightHandSide': {
                  'type': 'DATE',
                  'value': startDate
                }
              },
              'operator': 'AND',
              'rightHandSide': {
                'type': 'EXPRESSION',
                'leftHandSide': {
                  'type': 'MEASURE',
                  'value': {
                    'measure': 'ATTENDANCE',
                    'field': 'Date'
                  }
                },
                'operator': 'LESS_THAN_OR_EQUAL',
                'rightHandSide': {
                  'type': 'DATE',
                  'value': endDate
                }
              }
            }
          }
        }
      };
    return query;
  }


  /*
   * Helper functions below
   */


  function resolveStudentScopeObject(student, inputStudent) {
    if(!student) {
      student = {};
    }
    student.id = inputStudent[0];
    student.name = inputStudent[1];
    student.behavior = null;
    student.behaviorClass = resolveBehaviorClass(student.behavior);
    student.homework = Math.round(inputStudent[2] * 100);
    student.homeworkClass = resolveHomeworkClass(inputStudent[2]);
    student.attendanceClass= '0';
    student.gpa = null;
    student.gpaClass = resolveGpaClass(student.gpa);
    return student;
  }
  function resolveBehaviorClass(behaviorScore) {
    var greenThreshold = 35;
    var yellowThreshold = 55;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.green;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.behavior.yellow;
    }
    if(behaviorScore < yellowThreshold) {
      return '40-50';
    } else if(behaviorScore < greenThreshold) {
      return '70-80';
    } else if(behaviorScore){
      return '90-100';
    } else {
      return '0';
    }
  }
  function resolveHomeworkClass(homeworkScore) {
    var greenThreshold = 0.92;
    var yellowThreshold = 0.89;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.homework.green/100;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.homework.yellow/100;
    }
    if(homeworkScore < yellowThreshold) {
      return '40-50';
    } else if(homeworkScore < greenThreshold) {
      return '70-80';
    } else if(homeworkScore){
      return '90-100';
    } else {
      return '0';
    }
  }
  function resolveAttendanceClass(attendanceScore) {
    var greenThreshold = 3;
    var yellowThreshold = 6;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.attendance.green;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.attendance.yellow;
    }
    if(attendanceScore <= greenThreshold) {
      return '90-100';
    } else if(attendanceScore < yellowThreshold) {
      return '70-80';
    } else if(attendanceScore){
      return '40-50';
    } else {
      return '0';
    }
  }
  function resolveGpaClass(gpa) {
    var greenThreshold = 3.3;
    var yellowThreshold = 2.8;
    if(statebag.uiAttributes) {
      greenThreshold = statebag.uiAttributes.attributes.jsonNode.gpa.green;
      yellowThreshold = statebag.uiAttributes.attributes.jsonNode.gpa.yellow;
    }
    if(gpa >= greenThreshold) {
      return '90-100';
    } else if(gpa > yellowThreshold) {
      return '70-80';
    } else if(gpa) {
      return '50-60';
    } else {
      return '0';
    }
  }
}]);
