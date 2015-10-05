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
      var studentIds = [];
      statebag.students.forEach(function(s){
        studentIds.push(s.id);
      });
      var hwQuery = getHwQuery(statebag.currentYear.id, statebag.currentTerm.id, studentIds);
      var behaviorQuery = getBehaviorQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate, studentIds);
      var attendanceQuery = getAttendanceQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate, studentIds);
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
          }

        });
        //Update the attendance data for each student
        responses[2].records.forEach(function(student) {
          var studentAttendance = student.values;
          var pluckedStudent = studentMap[studentAttendance[0]];
          if (pluckedStudent) {
            pluckedStudent.attendance = studentAttendance[1];
            pluckedStudent.attendanceClass = resolveAttendanceClass(pluckedStudent.attendance);
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
      return deferred.promise;
    }
  };

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
                  'operator': 'GREATER_THAN',
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
                  'operator': 'LESS_THAN',
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
      }
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
    if(behaviorScore < 35) {
      return '90-100';
    } else if(behaviorScore < 45) {
      return '80-90';
    } else if(behaviorScore < 55) {
      return '70-80';
    } else if(behaviorScore < 65) {
      return '60-70';
    } else if(behaviorScore < 75) {
      return '50-60';
    } else {
      return '40-50';
    }
  }
  function resolveHomeworkClass(homeworkScore) {
    if(homeworkScore < 0.88) {
      return '40-50';
    } else if(homeworkScore < 0.89) {
      return '50-60';
    } else if(homeworkScore < 0.90) {
      return '60-70';
    } else if(homeworkScore < 0.91) {
      return '70-80';
    } else if(homeworkScore < 0.92) {
      return '80-90';
    } else {
      return '90-100';
    }
  }
  function resolveAttendanceClass(attendanceScore) {
    if(attendanceScore < 2) {
      return '90-100';
    } else if(attendanceScore < 3) {
      return '80-90';
    } else if(attendanceScore < 4) {
      return '70-80';
    } else if(attendanceScore < 5) {
      return '60-70';
    } else if(attendanceScore < 7) {
      return '50-60';
    } else {
      return '40-50';
    }
  }
  function resolveGpaClass(gpa) {
    if(gpa > 3.5) {
      return '90-100';
    } else if(gpa > 3.2) {
      return '80-90';
    } else if(gpa > 3.0) {
      return '70-80';
    } else if(gpa > 2.8) {
      return '60-70';
    } else if (gpa > 0){
      return '50-60';
    } else {
      return '0';
    }
  }
}]);
