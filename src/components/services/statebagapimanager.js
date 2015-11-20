'use strict';
angular.module('teacherdashboard')
.service('statebagApiManager', ['statebag', '$q', 'api', function(statebag, $q, api){
  var DATE_FORMAT = 'YYYY-MM-DD';
  //Returns a promise
  return {
    resolveCurrentYear: function() {
      var currentTime = new Date().getTime();
      for(var i = 0; i < statebag.school.years.length; i++) {
        if(statebag.school.years[i].startDate <= currentTime ||
          statebag.school.years[i].endDate >= curentTime) {
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
      //Find a full year term whose date range encloses the current date
      for(var i = 0; i < statebag.currentYear.terms.length; i++) {
        var portion = statebag.currentYear.terms[i].portion;
        var termStart = statebag.currentYear.terms[i].startDate;
        var termEnd = statebag.currentYear.terms[i].endDate;
        if(portion && portion === 1) {
          fullYearTerms.push(statebag.currentYear.terms[i]);
          if(termStart <= currentTime && termEnd >= currentTime) {
            return statebag.currentYear.terms[i];
          }
        }
      }
      //Find any term whose date range encloses the current date
      for(var i = 0; i < statebag.currentYear.terms.length; i++) {
        var termStart = statebag.currentYear.terms[i].startDate;
        var termEnd = statebag.currentYear.terms[i].endDate;
        if(termStart <= currentTime && termEnd >= currentTime) {
          return statebag.currentYear.terms[i]
        }
      }
      //Fail, so return the last term in the array
      if(fullYearTerms.length === 0) {
        return statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
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
            alert('failed to resolve the school!');
      }).$promise;
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
      uiAttrsDeferred.promise.then(function(){
        var studentIds = [];
        var studentMap = {};
        for(var i = 0; i < statebag.students.length; i++) {
          studentIds.push(statebag.students[i].id);
          studentMap[statebag.students[i].id] = { name: statebag.students[i].name, id: statebag.students[i].id };
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
          startDate: moment(statebag.currentYear.startDate).format(DATE_FORMAT),
          endDate: moment().format(DATE_FORMAT)
        }).$promise);

        //When both the GPA and HW/Attendance queries have returned, populate the objects bound to the DOM!
        $q.all(studentDataPromises).then(function(responses) {
          var resolvedStudents = [];
          //Handle the HW completion & attendance values
          responses[0].records.forEach(function(student){
            studentMap[student.values[0]] = resolveStudentScopeObject(student.values);
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
                resolvedStudents.unshift(pluckedStudent);
              }
            }
          }
          var maxEndDate = null;
          for (var student in responses[3]) {
            var score = responses[3][student];
            var pluckedStudent = studentMap[score.studentId];
            if(pluckedStudent && score.endDate &&
                ( !maxEndDate || maxEndDate <= score.endDate)) {
              maxEndDate = score.endDate;
              pluckedStudent.behavior = score.score;
              pluckedStudent.behaviorClass = resolveBehaviorClass(pluckedStudent.behavior);
              pluckedStudent.behaviorPeriod = returnComponentPeriod('behavior');
            }
          }
          statebag.lastFullRefresh = new Date().getTime();
          statebag.studentPerfData = resolvedStudents;
          deferred.resolve(statebag.studentPerfData);
        });
      });
      return deferred.promise;
    }
  };

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
    dates.min = new Date().getTime(),
    dates.max = new Date().getTime();
    //Resolve the date range
    switch(period) {
      case 'day':
        break;
      case 'week':
        dates.min = moment().day(0).valueOf();
        dates.max = moment().valueOf();
        break;
      case 'month':
        dates.min = moment().date(1).valueOf();
        dates.max = moment().valueOf();
        break;
      case 'term':
        dates.min = statebag.currentTerm.startDate;
        dates.max = statebag.currentTerm.endDate;
        break;
      case 'year':
        dates.min = statebag.currentYear.startDate;
        dates.max = statebag.currentYear.endDate;
        break;
    }
    //Never let a max date be greater than the current date, duh
    if(dates.max > moment().valueOf()) {
      dates.max = moment().valueOf();
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

  function getBehaviorQuery(minDate, maxDate, studentIds) {

    var behaviorQuery = {
        'aggregateMeasures': [
            {
                'measure': 'DEMERIT',
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
                          'measure': 'DEMERIT',
                          'field': 'Behavior Date'
                      }
                  },
                  'operator': 'GREATER_THAN_OR_EQUAL',
                  'rightHandSide': {
                      'type': 'DATE',
                      'value': minDate
                  }
              },
              'operator': 'AND',
              'rightHandSide': {
                  'type': 'EXPRESSION',
                  'leftHandSide': {
                      'type': 'MEASURE',
                      'value': {
                          'measure': 'DEMERIT',
                          'field': 'Behavior Date'
                      }
                  },
                  'operator': 'LESS_THAN_OR_EQUAL',
                  'rightHandSide': {
                      'type': 'DATE',
                      'value': maxDate
                  }
              }
          }
        }
    };
    return behaviorQuery;
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


  function resolveStudentScopeObject(inputStudent) {
    var student = {};
    student.id = inputStudent[0];
    student.name = inputStudent[1];
    student.behavior = null;
    student.behaviorClass = resolveBehaviorClass(student.behavior);
    student.homework = Math.round(inputStudent[2] * 100);
    student.homeworkClass = resolveHomeworkClass(inputStudent[2]);
    student.attendanceClass = '90-100';
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
    } else {
      return '90-100';
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
