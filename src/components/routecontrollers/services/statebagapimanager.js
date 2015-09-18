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
      var attendanceAndHwQuery = getHwAndAttendanceQuery(statebag.currentYear.id, statebag.currentTerm.id);
      var behaviorQuery = getBehaviorQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate);
      var studentDataPromises = [];
      //Get attendance & HW completion
      studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, attendanceAndHwQuery).$promise);
      studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, behaviorQuery).$promise);
      //Get the GPA results
      var studentIds = [];
      for(var i = 0; i < statebag.students.length; i++) {
        studentIds.push(statebag.students[i].id);
      }
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
          pluckedStudent.behavior = studentDemerits[1];
          pluckedStudent.behaviorClass = resolveBehaviorClass(pluckedStudent.behavior);
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
        statebag.lastFullRefresh = new Date().getTime();
        statebag.studentPerfData = resolvedStudents;
        deferred.resolve(statebag.studentPerfData);
      });
      return deferred.promise;
    }
  };
  
  function getBehaviorQuery(minDate, maxDate) {
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
    };
    return behaviorQuery;
  }
  function getHwAndAttendanceQuery(schoolYearId, termId) {
    var attendanceAndHwQuery = {
      'aggregateMeasures': [
        {'measure':'HW_COMPLETION','aggregation':'AVG'},
        {'measure':'ATTENDANCE','aggregation':'SUM'}
      ],
      'fields':[
        {'dimension':'STUDENT','field':'ID'},
        {'dimension':'STUDENT','field':'Name'}
      ],
      'filter': {
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
    };
    return attendanceAndHwQuery;
  }
  /*
   * Helper functions below
  **/
  function resolveStudentScopeObject(inputStudent) {
    var student = {};
    student.id = inputStudent[0];
    student.name = inputStudent[1];
    student.behavior = null;
    student.behaviorClass = resolveBehaviorClass(student.behavior);
    student.homework = Math.round(inputStudent[2] * 100);
    student.homeworkClass = resolveHomeworkClass(inputStudent[2]);
    student.attendance = inputStudent[3];
    student.attendanceClass = resolveAttendanceClass(student.attendance);
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
    if(attendanceScore < 43) {
      return '90-100';
    } else if(attendanceScore < 46) {
      return '80-90';
    } else if(attendanceScore < 49) {
      return '70-80';
    } else if(attendanceScore < 52) {
      return '60-70';
    } else if(attendanceScore < 55) {
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