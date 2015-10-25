'use strict';
angular.module('teacherdashboard')
.service('statebagApiManager', ['statebag', '$q', 'api', function(statebag, $q, api){
  //Returns a promise
  return {
    retrieveAndCacheSchool: function(schoolId) {
      return api.school.get(
        { schoolId: schoolId },
        //Success callback
        function(data){
            statebag.school = data;
            statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
            statebag.currentTerm = statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
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
        statebag.students.forEach(function(s){
          studentIds.push(s.id);
        });

        var behaviorDates = returnStartAndEndDate('behavior');
        var attendanceDates = returnStartAndEndDate('attendance');
        //TODO: currently HW completion is term, driven and not customizable, change this?
        // var homeworkDates = returnStartAndEndDate('homework');
        var hwQuery = getHwQuery(statebag.currentYear.id, statebag.currentTerm.id, studentIds);
        var behaviorQuery = getBehaviorQuery(behaviorDates.min, behaviorDates.max, studentIds);
        var attendanceQuery = getAttendanceQuery(attendanceDates.min, attendanceDates.max, studentIds);
        var studentDataPromises = [];

        //Get attendance & HW completion
        studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, hwQuery).$promise);
        studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, behaviorQuery).$promise);
        studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, attendanceQuery).$promise);
        studentDataPromises.push(api.gpa.get({schoolId: statebag.school.id, id: studentIds}).$promise);
        //When both the GPA and HW/Attendance queries have returned, populate the objects bound to the DOM!
        $q.all(studentDataPromises).then(function(responses) {
          var resolvedStudents = [];
          var studentMap = {};

          //Handle the HW completion & attendance values
          responses[0].records.forEach(function(student){
            studentMap[student.values[0]] = resolveStudentScopeObject(student.values);
          });
          //Update the behavior demerit counts
          responses[1].records.forEach(function(student) {
            var studentDemerits = student.values;
            var pluckedStudent = studentMap[studentDemerits[0]];
            if (pluckedStudent) {
              pluckedStudent.behavior = studentDemerits[1];
              pluckedStudent.behaviorClass = resolveBehaviorClass(pluckedStudent.behavior);
              pluckedStudent.behaviorPeriod = returnComponentPeriod('behavior');
            }

          });
          //Update the attendance data for each student
          responses[2].records.forEach(function(student) {
            var studentAttendance = student.values;
            var pluckedStudent = studentMap[studentAttendance[0]];
            if (pluckedStudent) {
              pluckedStudent.attendance = studentAttendance[1];
              pluckedStudent.attendanceClass = resolveAttendanceClass(pluckedStudent.attendance);
              pluckedStudent.attendancePeriod = returnComponentPeriod('attendance');
            }

          });
          //Update the GPA
          for (var idKey in responses[3]) {
            if (responses[3].hasOwnProperty(idKey) &&
                !isNaN(idKey)) {
              var pluckedStudent = studentMap[idKey];
              if(pluckedStudent) {
                pluckedStudent.gpa = Math.round( responses[3][idKey] * 10 ) / 10;
                pluckedStudent.gpaClass = resolveGpaClass(pluckedStudent.gpa);
                resolvedStudents.unshift(pluckedStudent);
              }
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
  function getHwQuery(schoolYearId, termId, studentIds) {
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
          'type':'EXPRESSION',
          'leftHandSide': {
            'type':'EXPRESSION',
            'leftHandSide':{
              'type':'EXPRESSION',
              'leftHandSide':{
                'value':{'dimension':'TERM','field':'ID'},
                'type':'DIMENSION'},
                'operator':'EQUAL',
                'rightHandSide':{'type':'NUMERIC','value': termId}
              },
              'operator':'AND',
              'rightHandSide':{
                'type':'EXPRESSION',
                'leftHandSide':{
                  'value':{'dimension':'YEAR','field':'ID'},
                  'type':'DIMENSION'
                },
                'operator':'EQUAL',
                'rightHandSide':{
                  'type':'NUMERIC',
                  'value': schoolYearId
                }
              }
            },
            'operator':'AND',
            'rightHandSide':{
              'type':'EXPRESSION',
              'leftHandSide':{
                'type':'DIMENSION',
                'value':{'dimension':'SECTION','field':'ID'}
              },
              'operator':'NOT_EQUAL',
              'rightHandSide':{'type':'NUMERIC','value':0
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
    if(behaviorScore <= greenThreshold) {
      return '90-100';
    } else if(behaviorScore <= yellowThreshold) {
      return '70-80';
    } else {
      return '40-50';
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
