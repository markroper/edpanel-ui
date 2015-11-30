'use strict';
angular.module('teacherdashboard')
  .controller('SchoolDash', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts) {
      statebag.currentPage.name = statebag.school.name;
      var min = moment(statebag.currentTerm.startDate).valueOf();
      var max = moment(statebag.currentTerm.endDate).valueOf();
      var teacherBehaviorDataDeferred = $q.defer();
      var studentAbsesnseAndTardyDeferred = $q.defer();
      $scope.teacherBehaviorPromise = teacherBehaviorDataDeferred.promise;
      $scope.studentAttendancePromise = studentAbsesnseAndTardyDeferred.promise;

      var meritDemeritsPromises = [];

      meritDemeritsPromises.push(api.query.save(
        { schoolId: statebag.school.id },
        getCountsOfTeacherMeritsAndDemerits(min, max)
      ).$promise);
      meritDemeritsPromises.push(api.query.save(
        { schoolId: statebag.school.id },
        getCountsOfAdminMeritsAndDemerits(min, max)
      ).$promise);
      $q.all(meritDemeritsPromises).then(function(results){
        var meritDemeritChartData = [ ['demerits'], ['merits'], ['teachers'] ];
        results.forEach(function(entity){
          for(var i = 0; i < entity.records.length; i++) {
            var singleRowResults = entity.records[i].values;
            if(singleRowResults[2] || singleRowResults[3]) {
              meritDemeritChartData[0].push(singleRowResults[2]);
              meritDemeritChartData[1].push(singleRowResults[3]);
              meritDemeritChartData[2].push(singleRowResults[1]);
            }
          }
        });
        teacherBehaviorDataDeferred.resolve(meritDemeritChartData);
      });

      api.query.save(
        { schoolId: statebag.school.id },
        getAbsenseAndTardyCount(min, max, statebag.school.id),
        function(results) {
          var attendanceHistogram = [
            ['students', 0, 0, 0, 0, 0, 0, 0 ],
            ['counts', '0', '0-1', '1-2', '2-4', '4-6', '6-8', '8+']
          ];
          for(var i = 0; i < results.records.length; i++) {
            var singleRowResults = results.records[i].values;
            //TODO: generify, hardocded for excel's formula of a tardy = .2 of an absence
            var score = singleRowResults[2] + (singleRowResults[3] * .2);
            if(score === 0) {
              attendanceHistogram[0][1]++;
            }else if(score <= 1) {
              attendanceHistogram[0][2]++;
            } else if(score <= 2) {
              attendanceHistogram[0][3]++;
            } else if(score <= 4) {
              attendanceHistogram[0][4]++;
            } else if(score <= 6) {
              attendanceHistogram[0][5]++;
            } else if(score <= 8) {
              attendanceHistogram[0][6]++;
            } else {
              attendanceHistogram[0][7]++;
            }
          }
          studentAbsesnseAndTardyDeferred.resolve(attendanceHistogram);
        }
      );

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
            { 'dimension':'STUDENT','field':'Name' }
          ],
          'filter': {
            'type': 'EXPRESSION',
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
