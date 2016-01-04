'use strict';

angular.module('teacherdashboard')
  .controller('TeacherHomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window', '$location',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window, $location) {
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: $location.url() });
      });
      statebag.currentPage.name = 'Sections';
      $scope.showFilter=true;
      $scope.hwPromise= {};
      retrieveTeacherHomeData();
      function retrieveTeacherHomeData() {
        /* This code block makes 1 api call, followed by 2 more api calls if the first one succeeds.
         * The first call resolve the students.  The second two calls
         * resolve different data about each of the students for use on the home page dashboard.
         * When the API calls resolve, the data is formatted a bit and then bound to the controller
         * scope variables that are bound to DOM elements
         */
        var promises = [];
        var sectionGradesPromise = [];
        var sectionPromise = [];
        //Resolve the students!
        promises.push(resolveSections());

        var demeritPromise = [];

        var behaviorQuery = getStudentsDemeritCount();
        sectionPromise.push(api.query.save({ schoolId: statebag.school.id }, behaviorQuery).$promise);

        //After the school and students are resolved, resolve the student performance data
        var sectionIds = [];
        $q.all(promises).then(function() {

          var hwQuery = getHwQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate, sectionIds);
          sectionPromise.push(api.query.save({ schoolId: statebag.school.id }, hwQuery).$promise);

          for (var i = 0; i < statebag.currentSections.length; i++) {
            sectionIds.push(statebag.currentSections[i].id);
            sectionPromise.push(resolveSectionGrades(statebag.currentSections[i], i));
          }

          sectionPromise.push(api.query.save({ schoolId: statebag.school.id}, getAttendanceQuery(sectionIds)).$promise);

          $q.all(sectionPromise).then(function(responses) {
            var hwCompletions = {};
            var demeritMap = {};
            console.log(responses);
            for (var j = 0; j < responses[0].records.length; j++ ) {
              demeritMap[responses[0].records[j].values[0]] = responses[0].records[j].values[2];
            }

            for (var i = 0; i < responses[1].records.length; i++) {
              var sectId = responses[1].records[i].values[0];
              var studId = responses[1].records[i].values[1];
              if (!hwCompletions[responses[1].records[i].values[0]]) {
                hwCompletions[sectId] = {};
                hwCompletions[sectId]["count"] = 0;
                hwCompletions[sectId]["total"] = 0;
                hwCompletions[sectId]["students"] = {};
              }

                hwCompletions[sectId]["count"] += 1;
                hwCompletions[sectId]["total"] += Math.round(parseFloat(responses[1].records[i].values[2]) * 100);
                hwCompletions[sectId]["students"][studId] = Math.round(parseFloat(responses[1].records[i].values[2]) * 100);
             }

            var attendanceMap = {};
            var attendanceResults = responses[responses.length-1].records;

            for (var i = 0; i < attendanceResults.length; i ++) {
              var result = attendanceResults[i].values;
              //Result[0] is student Id, result[1] is sectionId and result[2] is the count
              if (typeof attendanceMap[result[1]] === 'undefined') {
                attendanceMap[result[1]] = {};
                //Track total number of absences
                attendanceMap[result[1]]["total"] = 0;
                //Track totall number of students
                attendanceMap[result[1]]["count"] = 0;
              }
              attendanceMap[result[1]][result[0]] = result[2];
              attendanceMap[result[1]]["total"] += result[2];
              attendanceMap[result[1]]["count"] += 1;
            }
            console.log(attendanceMap);

            console.log(demeritMap);
            for (var i = 0; i < statebag.currentSections.length; i++) {
              sectId = statebag.currentSections[i].id;
              console.log(hwCompletions[sectId]);
              //TODO have to give a grey class if its not graded
              if (typeof hwCompletions[sectId] != 'undefined') {
                statebag.currentSections[i]["HomeworkCompletion"] = hwCompletions[sectId]["total"] / hwCompletions[sectId].count;
                statebag.currentSections[i]["Attendance"] = parseFloat((attendanceMap[sectId].total / attendanceMap[sectId].count).toFixed(1));
                for (var j = 0; j < statebag.currentSections[i].enrolledStudents.length; j++) {
                  studId = statebag.currentSections[i].enrolledStudents[j].id;
                  statebag.currentSections[i].enrolledStudents[j]["homework"] = hwCompletions[sectId]["students"][studId];
                  statebag.currentSections[i].enrolledStudents[j]["homeworkClass"] = statebagApiManager.resolveHomeworkClass(
                    hwCompletions[sectId]["students"][studId]/100.0);

                  var absences = attendanceMap[sectId][studId];
                  //If it is undefined it means nothing came back from teh query so we have zero absenses
                  if (!absences) {
                    absences = 0
                  }
                  statebag.currentSections[i].enrolledStudents[j]["attendance"] = absences;
                  statebag.currentSections[i].enrolledStudents[j]["attendanceClass"] = statebagApiManager.resolveAttendanceClass(
                    absences);
                  var studentDemerits = demeritMap[studId];
                  if (!studentDemerits) {
                    studentDemerits = 0;

                  }
                  statebag.currentSections[i].enrolledStudents[j]["demerits"] = studentDemerits;
                  statebag.currentSections[i].enrolledStudents[j]["demeritClass"] = statebagApiManager.resolveBehaviorClass(studentDemerits);

                }
              }

            }
            statebag.hwCompleteSections = hwCompletions;
          });

          $q.all(sectionPromise).then(function() {
            $scope.sections = statebag.currentSections;
          });

        });

      }

      function  getStudentsDemeritCount() {
        var identity = authentication.identity();
        var personQuery = {
          "aggregateMeasures":[
            {
              "measure":"DEMERIT",
              "aggregation":"SUM"
            }
          ],
          "fields":[
            {
              "dimension":"STUDENT",
              "field":"ID"
            },
            {
              "dimension":"STUDENT",
              "field":"Name"
            }
          ],
          "filter":{
            "type":"EXPRESSION",
            "leftHandSide": {
              "type": "EXPRESSION",
              "leftHandSide": {
                "type": "EXPRESSION",
                "leftHandSide": {
                  "type": "DIMENSION",
                  "value": {
                    "dimension": "STUDENT",
                    "field": "School"
                  }
                },
                "operator": "EQUAL",
                "rightHandSide": {
                  "type": "NUMERIC",
                  "value": statebag.school.id
                }
              },
              "operator": "AND",
              "rightHandSide": {
                "type": "EXPRESSION",
                "leftHandSide": {
                  "type": "EXPRESSION",
                  "leftHandSide": {
                    "type": "MEASURE",
                    "value": {
                      "measure": "DEMERIT",
                      "field": "Behavior Date"
                    }
                  },
                  "operator": "GREATER_THAN_OR_EQUAL",
                  "rightHandSide": {
                    "type": "DATE",
                    "value": statebag.currentTerm.startDate
                  }
                },
                "operator": "AND",
                "rightHandSide": {
                  "type": "EXPRESSION",
                  "leftHandSide": {
                    "type": "MEASURE",
                    "value": {
                      "measure": "DEMERIT",
                      "field": "Behavior Date"
                    }
                  },
                  "operator": "LESS_THAN_OR_EQUAL",
                  "rightHandSide": {
                    "type": "DATE",
                    "value": statebag.currentTerm.endDate
                  }
                }
              }
            },
            "operator":"AND",
            "rightHandSide":{
              "type":"EXPRESSION",
              "leftHandSide":{
                "type": "DIMENSION",
                "value": {
                  "dimension":"USER",
                  "field":"ID"
                }
              },
              "operator": "EQUAL",
              "rightHandSide": {
                "type": "NUMERIC",
                "value": identity.id
              }
            }
          }
        };
        return personQuery;
      }

      function resolveSections() {
        var identity = authentication.identity();
          //retrieve the teachers current students
          return api.teacherSections.get(
            {
              schoolId: statebag.school.id,
              yearId: statebag.currentYear.id,
              termId: statebag.currentTerm.id,
              teacherId: identity.id
            },
            //Success callback
            function(data){
              statebag.currentSections = data;


            },
            //Error callback
            function(){
              console.log('failed to resolve the students!');
            }).$promise;

      }

      function resolveSectionGrades(sectionData, index) {
        return api.sectionGrades.get(
          {
            schoolId: statebag.school.id,
            yearId: statebag.currentYear.id,
            termId: statebag.currentTerm.id,
            sectionId: sectionData.id
          },
          //Success callback
          function(data){
            statebag.currentSections[index]["grades"] = data;
            var total = 0;
            data.sort(function(grade) {
              return grade.student.id;
            });
            statebag.currentSections[index].enrolledStudents.sort(function(student) {
              return student.id;
            });
            var isGradedClass = false;
            for (var i = 0; i < data.length; i++) {

              if ( typeof data[i].grade != 'undefined') {
                isGradedClass = true;
                total += data[i].grade;
                statebag.currentSections[index].enrolledStudents[i]["grade"] = data[i].grade;
                statebag.currentSections[index].enrolledStudents[i]["gradeClass"] = statebagApiManager.resolveSectionGradeClass(data[i].grade);

              }

            }
            if (isGradedClass) {

              statebag.currentSections[index]["aveGrade"] = Math.round(total/data.length);
            }
            //TODO ADD GRAY CLASS FOR NON GRADED CALSSSES


          },
          //Error callback
          function(){
            console.log('failed to resolve the students!');
          }).$promise;
      }

      function getSectionIdsExpression(sectionIds) {
        return {
          'type': 'EXPRESSION',
          'leftHandSide': {
            'type': 'DIMENSION',
            'value': {
              'dimension': 'SECTION',
              'field': 'ID'
            }
          },
          'operator': 'IN',
          'rightHandSide': {
            'type': 'LIST_NUMERIC',
            'value': sectionIds
          }
        };
      }

      function getAttendanceQuery(sectionIds) {
        return {
          "aggregateMeasures": [
            {
              "measure": "ABSENCE",
              "aggregation": "COUNT"
            }
          ],
          "fields": [
            {
              "dimension": "STUDENT",
              "field": "ID"
            },
            {
              "dimension": "SECTION",
              "field": "ID"
            }
          ],
          "filter": getSectionIdsExpression(sectionIds)
        }
      }

      function getHwQuery(startDate, endDate, studentIds) {
        var hwQuery = {
          'aggregateMeasures': [
            {'measure':'HW_COMPLETION','aggregation':'AVG'}
          ],
          'fields':[
            {'dimension':"SECTION",'field':'ID'},
            {'dimension':"STUDENT",'field':'ID'}
          ],
          'filter': {
            'type': 'EXPRESSION',
            'leftHandSide': getSectionIdsExpression(studentIds),
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

  }]);
