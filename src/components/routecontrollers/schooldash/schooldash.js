'use strict';
angular.module('teacherdashboard')
  .controller('SchoolDash', ['$scope', 'api', 'statebag', '$q',  '$window', '$location',
    function ($scope, api, statebag, $q, $window, $location) {
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: $location.url() });
      });
      statebag.currentPage.name = 'School Dashboard';
      var min = moment(statebag.currentTerm.startDate).valueOf();
      var max = moment(statebag.currentTerm.endDate).valueOf();
      var teacherBehaviorDataDeferred = $q.defer();
      var studentAbsesnseAndTardyDeferred = $q.defer();
      var failingClassesDeferred = $q.defer();
      var studentGpaDataDeferred = $q.defer();
      var termsDeferred = $q.defer();


      $scope.gpaDataPromise = studentGpaDataDeferred.promise;
      $scope.teacherBehaviorPromise = teacherBehaviorDataDeferred.promise;
      $scope.studentAttendancePromise = studentAbsesnseAndTardyDeferred.promise;
      $scope.failingClassesPromise = failingClassesDeferred.promise;
      $scope.termsPromise = termsDeferred.promise;


      $scope.failingBreakdown = "RACE";
      $scope.attendanceBreakdown = "RACE";
      $scope.attendanceTerm = statebag.currentTerm ;
      $scope.failingTerm = statebag.currentTerm ;
      $scope.demeritTerm = statebag.currentTerm;
      //TODO We can't change GPA terms yet
      //$scope.gpaTerm = statebag.currentTerm;
      $scope.gpaTerm = "2015-2016";
      $scope.attendanceControl = {

      };
      $scope.failureControl = {

      };
      $scope.demeritControl = {

      };

      $scope.updateDemeritTerm = function() {
        var meritDemeritsPromises = [];
        makeMeritDemeritRequests(meritDemeritsPromises);

        $q.all(meritDemeritsPromises).then(function(results){
          var meritDemeritChartData = [ ['merits'], ['demerits'], ['teachers'] ];
          results.forEach(function(entity){
            for(var i = 0; i < entity.records.length; i++) {
              var singleRowResults = entity.records[i].values;
              if(singleRowResults[2] || singleRowResults[3]) {
                meritDemeritChartData[0].push(singleRowResults[3]);
                meritDemeritChartData[1].push(singleRowResults[2]);
                meritDemeritChartData[2].push(singleRowResults[1]);
              }
            }
          });
          $scope.demeritControl.updateChart(meritDemeritChartData);
        });
      };

      $scope.updateAttendanceTerm = function() {
        var attendanceStatus = [];
        attendanceStatus.push(api.query.save(
          { schoolId: statebag.school.id },
          getAbsenseAndTardyCount($scope.attendanceTerm.startDate, $scope.attendanceTerm.endDate, statebag.school.id)).$promise);
          $q.all(attendanceStatus).then(function(results){
            var singleRowResults;
            var gender;
            var race;
            if ($scope.attendanceBreakdown == "GENDER") {
              var attendanceHistogram = [
                ['Male', 0, 0, 0, 0, 0, 0, 0],
                ['Female', 0, 0, 0, 0, 0, 0, 0],
                ['counts', '0', '0-1', '1-2', '2-4', '4-6', '6-8', '8+']
              ];

              for (var i = 0; i < results[0].records.length; i++) {
                singleRowResults = results[0].records[i].values;
                gender = singleRowResults[2];
                generateAttendanceBuckets(singleRowResults, gender, attendanceHistogram);
              }
              $scope.attendanceControl.updateChart(attendanceHistogram);
            } else {
              var attendanceHistogram = [
                ['Caucasian', 0, 0, 0, 0, 0, 0, 0],
                ['African American', 0, 0, 0, 0, 0, 0, 0],
                ['Asian', 0, 0, 0, 0, 0, 0, 0],
                ['American Indian', 0, 0, 0, 0, 0, 0, 0],
                ['Hispanic or Latino', 0, 0, 0, 0, 0, 0, 0],
                ['Pacific Islander', 0, 0, 0, 0, 0, 0, 0],
                ['counts', '0', '0-1', '1-2', '2-4', '4-6', '6-8', '8+']
              ];

              for (var i = 0; i < results[0].records.length; i++) {
                singleRowResults = results[0].records[i].values;
                race = resolveRaceAttendanceSelector(singleRowResults[3], singleRowResults[4]);
                generateAttendanceBuckets(singleRowResults, race, attendanceHistogram);

              }
              $scope.attendanceControl.updateChart(attendanceHistogram);
            }

      });

      }

      //TODO REMOVE THIS,
      //This is a map between the term ids we have and the term ids that are stored in the termGrades of SSG
      var hackyMap = {
        1: 115931, //Full year
        2: 115929, //S1
        3: 115930, //S2
        4: 115925, //Q1
        5: 115926, //Q2
        6: 115927, //Q3
        7: 115928 //Q4
      };

      $scope.changeFailingBreakdown = function() {

        var failingPromises = [];

        makeFailureRequests(failingPromises, hackyMap[$scope.failingTerm.id]);

        $q.all(failingPromises).then(function(results) {
          var failingChartData = [];
          results[0].forEach(function(entity) {
            var array = [];
            for (var key in entity.toJSON()) {
              array.push(entity[key]);
            }
            failingChartData.push(array);
          });
          $scope.failureControl.updateChart(failingChartData);
        });

      };

      var failingPromises = [];

      makeFailureRequests(failingPromises, hackyMap[$scope.failingTerm.id]);

      $q.all(failingPromises).then(function(results) {
        var failingChartData = [];
        results[0].forEach(function(entity) {
          var array = [];
          for (var key in entity.toJSON()) {
            array.push(entity[key]);
          }
          failingChartData.push(array);
        });
        failingClassesDeferred.resolve(failingChartData);
      });

      var termPromises = [];
      //TODO We should make this work over multiple years
      termPromises.push(api.terms.get(
        {
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id
        }
      ).$promise);
      $q.all(termPromises).then(function(results) {
        var terms = [];
        results[0].forEach(function(entity) {
          terms.push(entity);
        });
        termsDeferred.resolve(terms);
        $scope.terms = terms;
      })





      //Resolve GPAs for current students
      api.gpasInSchool.get(
        { schoolId: statebag.school.id },
        function(results) {
          var gpaData = [
            ['students', 0, 0, 0, 0, 0, 0, 0],
            ['counts', '0 - 1', '1 - 1.5', '1.5 - 2', '2 - 2.5', '2.5 - 3', '3 - 3.5', '3.5 - 4']
          ];
          for(var i = 0; i < results.length; i++) {
            var score = results[i].score;
            if(score <= 1) {
              gpaData[0][1]++;
            } else if(score <= 1.5) {
              gpaData[0][2]++;
            } else if(score <= 2) {
              gpaData[0][3]++;
            } else if(score <= 2.5) {
              gpaData[0][4]++;
            } else if(score <= 3) {
              gpaData[0][5]++;
            } else if (score <= 3.5) {
              gpaData[0][6]++;
            } else if (score > 3.5) {
              gpaData[0][7]++;
            }
          }
          studentGpaDataDeferred.resolve(gpaData);
        });

      //Resolve merits and demerits awarded by all teachers and admins in the school
      var meritDemeritsPromises = [];
      makeMeritDemeritRequests(meritDemeritsPromises);

      $q.all(meritDemeritsPromises).then(function(results){
        var meritDemeritChartData = [ ['merits'], ['demerits'], ['teachers'] ];
        results.forEach(function(entity){
          for(var i = 0; i < entity.records.length; i++) {
            var singleRowResults = entity.records[i].values;
            if(singleRowResults[2] || singleRowResults[3]) {
              meritDemeritChartData[0].push(singleRowResults[3]);
              meritDemeritChartData[1].push(singleRowResults[2]);
              meritDemeritChartData[2].push(singleRowResults[1]);
            }
          }
        });
        teacherBehaviorDataDeferred.resolve(meritDemeritChartData);
      });

      //Resolve absense and tardy data
      api.query.save(
        { schoolId: statebag.school.id },
        getAbsenseAndTardyCount(min, max, statebag.school.id),
        function(results) {
          var singleRowResults;
          var gender;
          var race;
          var attendanceHistogram;
          if ($scope.attendanceBreakdown == "GENDER") {
            attendanceHistogram = [
              ['male', 0, 0, 0, 0, 0, 0, 0],
              ['female', 0, 0, 0, 0, 0, 0, 0],
              ['counts', '0', '0-1', '1-2', '2-4', '4-6', '6-8', '8+']
            ];
            for(var i = 0; i < results.records.length; i++) {
               singleRowResults = results.records[i].values;
               gender = singleRowResults[2];
              generateAttendanceBuckets(singleRowResults, gender, attendanceHistogram);
            }
            studentAbsesnseAndTardyDeferred.resolve(attendanceHistogram);
          } else {
            attendanceHistogram = [
              ['Caucasian', 0, 0, 0, 0, 0, 0, 0],
              ['African American', 0, 0, 0, 0, 0, 0, 0],
              ['Asian', 0, 0, 0, 0, 0, 0, 0],
              ['American Indian', 0, 0, 0, 0, 0, 0, 0],
              ['Hispanic or Latino', 0, 0, 0, 0, 0, 0, 0],
              ['Pacific Islander', 0, 0, 0, 0, 0, 0, 0],
              ['counts', '0', '0-1', '1-2', '2-4', '4-6', '6-8', '8+']
            ];

            for (var i = 0; i < results.records.length; i++) {
              singleRowResults = results.records[i].values;
              race = resolveRaceAttendanceSelector(singleRowResults[3], singleRowResults[4]);
              generateAttendanceBuckets(singleRowResults, race, attendanceHistogram);
            }
            studentAbsesnseAndTardyDeferred.resolve(attendanceHistogram);
          }
        }
      );

      function resolveRaceAttendanceSelector(raceCode, ethnicity) {
        switch (raceCode) {
          case "W":
                return 0;
          case "B":
                return 1;
          case "A":
                return 2;
          case "I":
            if (ethnicity == "YES") {
              return 4;
            } else {
              return 3;
            }
          case "P":
                return 5;
          default:
            //TODO There is a null value... what do we do about their race...
                return 0;
        }
      }

      function generateAttendanceBuckets(singleRowResults, rowSelector, attendanceHistogram) {
          //Male = 0 Female=1;
          //TODO: generify, hardocded for excel's formula of a tardy = .2 of an absence
          var score = singleRowResults[5] + (singleRowResults[6] * 0.2);
          if(score === 0) {
            attendanceHistogram[rowSelector][1]++;
          }else if(score <= 1) {
            attendanceHistogram[rowSelector][2]++;
          } else if(score <= 2) {
            attendanceHistogram[rowSelector][3]++;
          } else if(score <= 4) {
            attendanceHistogram[rowSelector][4]++;
          } else if(score <= 6) {
            attendanceHistogram[rowSelector][5]++;
          } else if(score <= 8) {
            attendanceHistogram[rowSelector][6]++;
          } else {
            attendanceHistogram[rowSelector][7]++;
          }

      }

      function makeMeritDemeritRequests(promises) {
        promises.push(api.query.save(
          { schoolId: statebag.school.id },
          getCountsOfTeacherMeritsAndDemerits($scope.demeritTerm.startDate, $scope.demeritTerm.endDate)
        ).$promise);
        promises.push(api.query.save(
          { schoolId: statebag.school.id },
          getCountsOfAdminMeritsAndDemerits($scope.demeritTerm.startDate, $scope.demeritTerm.endDate)
        ).$promise);
      }

      function makeFailureRequests(promises, termId) {
        promises.push(api.failingClasses.get(
          {
            schoolId: statebag.school.id,
            schoolYearId: statebag.currentYear.id,
            termId: termId,
            breakdownKey: $scope.failingBreakdown
          }).$promise);
      }

      function getAbsenseAndTardyCount(startDate, endDate, schoolId) {
        if(!schoolId) {
          schoolId = statebag.school.id;
        }
        var teacherBehaviorQuery = {
          'aggregateMeasures': [
            {'measure':'ABSENCE','aggregation':'SUM'},
            {'measure':'TARDY','aggregation':'SUM'}
          ],
          'fields':[
            { 'dimension':'STUDENT','field':'ID' },
            { 'dimension':'STUDENT','field':'Name' },
            { 'dimension':'STUDENT','field':'Gender'},
            { 'dimension':'STUDENT','field':'Race'},
            {'dimension':'STUDENT', 'field':'Ethnicity'}

          ],
          'filter': {
            'type': 'EXPRESSION',
            //'leftHandSide': {
            'leftHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                'type': 'DIMENSION',
                'value': {
                  'dimension': 'STUDENT',
                  'field': 'School'
                }
              },
              'operator': 'EQUAL',
              'rightHandSide': {
                'type': 'NUMERIC',
                'value': schoolId
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
                    'measure': 'ABSENCE',
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
                    'measure': 'ABSENCE',
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
        return teacherBehaviorQuery;
      }

      function getCountsOfAdminMeritsAndDemerits(startDate, endDate) {
        return getCountsOfAdultMeritsAndDemerits(startDate, endDate, 'ADMINISTRATOR');
      }
      function getCountsOfTeacherMeritsAndDemerits(startDate, endDate) {
        return getCountsOfAdultMeritsAndDemerits(startDate, endDate, 'TEACHER');
      }
      function  getCountsOfAdultMeritsAndDemerits(startDate, endDate, personDim) {
        var personQuery = {
          'aggregateMeasures': [
            {'measure':'DEMERIT','aggregation':'SUM'},
            {'measure':'MERIT','aggregation':'SUM'}
          ],
          'fields':[
            { 'dimension': personDim,'field':'ID' },
            { 'dimension': personDim,'field':'Name' }
          ],
          'filter': {
            'type': 'EXPRESSION',
            'leftHandSide': {
              'type': 'EXPRESSION',
              'leftHandSide': {
                'type': 'DIMENSION',
                'value': {
                  'dimension': personDim,
                  'field': 'School'
                }
              },
              'operator': 'EQUAL',
              'rightHandSide': {
                'type': 'NUMERIC',
                'value': statebag.school.id
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
                    'measure': 'DEMERIT',
                    'field': 'Behavior Date'
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
                    'measure': 'DEMERIT',
                    'field': 'Behavior Date'
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
        return personQuery;
      }

    }]);
