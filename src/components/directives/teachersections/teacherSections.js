'use strict';

angular.module('teacherdashboard')
  .directive('teacherSections', [ 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication',
    function (api, statebag, $q, $state, statebagApiManager, authentication) {
      return {
        scope: {

        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/teachersections/teacherSections.html',
        replace: true,
        link: function(scope) {
          statebag.currentPage.name = 'Sections';
          scope.showFilter=true;
          scope.hwPromise= {};
          retrieveTeacherHomeData();
          function retrieveTeacherHomeData() {
            var promises = [];
            var sectionPromise = [];
            //Resolve the sections this teacher teaches
            promises.push(resolveSections());


            //Get all demerits that this teacher has assigned, grouped by student Id
            var behaviorQuery = getStudentsDemeritCount();
            sectionPromise.push(api.query.save({ schoolId: statebag.school.id }, behaviorQuery).$promise);


            var sectionIds = [];
            //When we have resolved what sections are taught we can get info about the students in those sections
            $q.all(promises).then(function() {

              //Get HW completion rate for each student in every section
              var hwQuery = getHwQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate, sectionIds);
              sectionPromise.push(api.query.save({ schoolId: statebag.school.id }, hwQuery).$promise);

              //We can only get section grades on one section at a time, make several API calls
              //TODO API endpoint or query generator to get section grades for a list of sections for less API calls?
              for (var i = 0; i < statebag.currentSections.length; i++) {
                sectionIds.push(statebag.currentSections[i].id);
                sectionPromise.push(resolveSectionGrades(statebag.currentSections[i], i));
              }

              //Get the numbers of absences that occurred per section, per student
              sectionPromise.push(api.query.save({ schoolId: statebag.school.id}, getAttendanceQuery(sectionIds)).$promise);

              //When we have attendance info, demerit info and hw info for each student and section
              $q.all(sectionPromise).then(function(responses) {
                var hwCompletions = {};
                var demeritMap = {};
                //responses[0] is the demerit query
                for (j = 0; j < responses[0].records.length; j++ ) {
                  //values[0] is the studentID, so this map goes from studentId to count of demerits
                  demeritMap[responses[0].records[j].values[0]] = responses[0].records[j].values[2];
                }

                //responses[1] is the homework query
                for (i = 0; i < responses[1].records.length; i++) {
                  var sectId = responses[1].records[i].values[0];
                  var studId = responses[1].records[i].values[1];


                  if (!hwCompletions[responses[1].records[i].values[0]]) {
                    hwCompletions[sectId] = {};
                    //We need average info for a section, but also info for each student
                    //Hence this map
                    hwCompletions[sectId]["count"] = 0;
                    hwCompletions[sectId]["total"] = 0;
                    hwCompletions[sectId]["students"] = {};
                  }

                  hwCompletions[sectId]["count"] += 1;
                  hwCompletions[sectId]["total"] += Math.round(parseFloat(responses[1].records[i].values[2]) * 100);
                  hwCompletions[sectId]["students"][studId] = Math.round(parseFloat(responses[1].records[i].values[2]) * 100);
                }

                var attendanceMap = {};
                //Attendance is the last promise that is added to this list
                var attendanceResults = responses[responses.length-1].records;

                for (i = 0; i < attendanceResults.length; i ++) {
                  var result = attendanceResults[i].values;
                  //Result[0] is student Id, result[1] is sectionId and result[2] is the count
                  if (!attendanceMap[result[1]]) {
                    attendanceMap[result[1]] = {};
                    //Track total number of absences
                    attendanceMap[result[1]]["total"] = 0;
                    //Track total number of students
                    attendanceMap[result[1]]["count"] = 0;
                  }
                  attendanceMap[result[1]][result[0]] = result[2];
                  attendanceMap[result[1]]["total"] += result[2];
                  attendanceMap[result[1]]["count"] += 1;
                }

                for (i = 0; i < statebag.currentSections.length; i++) {
                  sectId = statebag.currentSections[i].id;
                  var numStudentsEnrolled = statebag.currentSections[i].enrolledStudents.length;

                  //Some classes don't have grades. Only if it does should we add overall homework completion
                  if (typeof hwCompletions[sectId] !== 'undefined' ) {
                    statebag.currentSections[i]["HomeworkCompletion"] = Math.round(
                        hwCompletions[sectId]["total"] / hwCompletions[sectId].count * 10) / 10;
                  }
                  //Overall average of attendance
                  statebag.currentSections[i]["Attendance"] = parseFloat((attendanceMap[sectId].total / numStudentsEnrolled).toFixed(1));

                  //FOr each section, iterate over all the students
                  for (var j = 0; j < numStudentsEnrolled; j++) {
                    studId = statebag.currentSections[i].enrolledStudents[j].id;
                    //If the section doesn't have grades don't populate the average homework for that grade
                    if (typeof hwCompletions[sectId] !== 'undefined' && hwCompletions[sectId]["total"] !== 0) {
                      statebag.currentSections[i].enrolledStudents[j]["homework"] = hwCompletions[sectId]["students"][studId];
                      statebag.currentSections[i].enrolledStudents[j]["homeworkClass"] = statebagApiManager.resolveHomeworkClass(
                        hwCompletions[sectId]["students"][studId]/100.0);
                    }

                    var absences = attendanceMap[sectId][studId];
                    //If it is undefined it means nothing came back from the query so we have zero absences
                    if (!absences) {
                      absences = 0
                    }
                    statebag.currentSections[i].enrolledStudents[j]["attendance"] = absences;
                    statebag.currentSections[i].enrolledStudents[j]["attendanceClass"] = statebagApiManager.resolveAttendanceClass(
                      absences);

                    //If its undefined this teacher has given them no demerits so we say they have 0
                    var studentDemerits = demeritMap[studId];
                    if (!studentDemerits) {
                      studentDemerits = 0;

                    }
                    statebag.currentSections[i].enrolledStudents[j]["demerits"] = studentDemerits;
                    statebag.currentSections[i].enrolledStudents[j]["demeritClass"] = statebagApiManager.resolveBehaviorClass(studentDemerits);

                  }

                }
              });

              //Put it on the statebag
              $q.all(sectionPromise).then(function() {
                scope.sections = statebag.currentSections;
              });

            });

          }


            /**
             * This function will resolve the sections a teacher teaches
             * @returns {*|Function}
             */
          function resolveSections() {
            var identity = authentication.identity();
            //retrieve the teachers current sections
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
                console.log('failed to resolve the sections!');
              }).$promise;

          }

          /**
           * Resolve the section grades for a particular section
           * @param sectionData
           * @param index
           * @returns {*|Function}
             */
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

                  //If this is a graded class
                  if ( typeof data[i].grade !== 'undefined') {
                    isGradedClass = true;
                    total += data[i].grade;
                    statebag.currentSections[index].enrolledStudents[i]["grade"] = data[i].grade;
                    statebag.currentSections[index].enrolledStudents[i]["gradeClass"] = statebagApiManager.resolveSectionGradeClass(data[i].grade);

                  }

                }
                if (isGradedClass) {

                  statebag.currentSections[index]["aveGrade"] = Math.round(total/data.length);
                }


              },
              //Error callback
              function(){
                console.log('failed to resolve the students!');
              }).$promise;
          }

          /*
          *Giant queries live below here
           */
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
                  "measure": "SECTION_ABSENCE",
                  "aggregation": "SUM"
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
        }
      }



  }]);
