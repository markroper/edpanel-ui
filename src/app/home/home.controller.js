'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', ['$scope', 'api', 'statebag', '$q', 
    function ($scope, api, statebag, $q, $stateParams) {
      //We need to reload the statebag if any relevant values are null or the data is more than 5 minutes old
      if(!statebag.school || !statebag.currentYear || !statebag.currentTerm || 
        !statebag.studentPerfData || !statebag.students || !statebag.lastFullRefresh || 
        statebag.lastFullRefresh > (new Date().getTime() - 1000 * 60 * 5))
        {
          /* This code block makes 2 api calls, followed by 2 more api calls if the first two both succeed.
           * The first two calls resolve the school and the students.  The second two calls
           * resolve different data about each of the students for use on the home page dashboard.
           * When the API calls resolve, the data is formatted a bit and then bound to the controller 
           * scope variables that are bound to DOM elements
          */
          var promises = [];
          if(!statebag.school) {
            //Resolve the school
            promises.push(api.school.get(
              { schoolId: $stateParams.schoolId },
              //Success callback
              function(data){
                  statebag.school = data[0];
                  statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
                  statebag.currentTerm = statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
              },
              //Error callback
              function(){
                  alert('failed to resolve the school!');
            }).$promise);
          }

          //Resolve the students!
          promises.push(api.students.get(
            {},
            //Success callback
            function(data){
              statebag.students = data;
            },
            //Error callback
            function(){
              alert('failed to resolve the students!');
            }).$promise);

          //After the school and students are resolved, resolve the student performance data
          $q.all(promises).then(function(){
            var attendanceAndHwQuery = getHwAndAttendanceQuery(statebag.currentYear.id, statebag.currentTerm.id);
            var studentDataPromises = [];
            //Get attendance & HW completion
            studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, attendanceAndHwQuery).$promise);
            //Get the GPA results
            var studentIds = [];
            for(var i = 0; i < statebag.students.length; i++) {
              studentIds.push(statebag.students[i].id);
            }
            studentDataPromises.push(api.gpa.get({schoolId: statebag.school.id, id: studentIds}).$promise);
            
            //When both the GPA and HW/Attendance queries have returned, populate the objects bound to the DOM!
            $q.all(studentDataPromises).then(function(responses){
              var resolvedStudents = [];
              responses[0].records.forEach(function(student){
                resolvedStudents.push(resolveStudentScopeObject(student.values));
              });
              for(var i=0; i < resolvedStudents.length; i++) {
                var studentGpa = responses[1][resolvedStudents[i].id];
                resolvedStudents[i].gpa = studentGpa;
                resolvedStudents[i].gpaClass = resolveGpaClass(studentGpa);
              }
              $scope.students = statebag.studentPerfData = resolvedStudents;
            });
          });
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
        return '0';
      }
      function resolveHomeworkClass(homeworkScore) {
        if(homeworkScore < 0.45) {
          return '40-50';
        } else if(homeworkScore < 0.47) {
          return '50-60';
        } else if(homeworkScore < 0.49) {
          return '60-70';
        } else if(homeworkScore < 0.5) {
          return '70-80';
        } else if(homeworkScore < 0.51) {
          return '80-90';
        } else {
          return '90-100';
        }
      }
      function resolveAttendanceClass(attendanceScore) {
        if(attendanceScore < 290) {
          return '90-100';
        } else if(attendanceScore < 295) {
          return '80-90';
        } else if(attendanceScore < 300) {
          return '70-80';
        } else if(attendanceScore < 305) {
          return '60-70';
        } else if(attendanceScore < 310) {
          return '50-60';
        } else {
          return '40-50';
        }
      }
      function resolveGpaClass(gpa) {
        if(gpa > 3.5) {
          return '90-100';
        } else if(gpa > 3.0) {
          return '80-90';
        } else if(gpa > 2.5) {
          return '70-80';
        } else if(gpa > 2.0) {
          return '60-70';
        } else if (gpa > 0){
          return '50-60';
        } else {
          return '0';
        }
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
  }]);