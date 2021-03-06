'use strict';
angular.module('teacherdashboard')
  .directive('edpanelReport', [ '$window', 'api', 'statebag', '$q', '$compile', 'consts', function($window, api, statebag, $q, $compile, consts) {
    return {
      scope: {
        report: '=',
        terms: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/edpanelReport.html',
      replace: true,
      link: function(scope, elem) {
        scope.failureControl = {};
        scope.dataDeferred = $q.defer();
        scope.dataPromise = scope.dataDeferred.promise;
        scope.currentTerm = statebag.currentTerm;
        scope.showFilter = false;
        scope.demographic = null;
        scope.toggleFilters = function() {
          scope.showFilter = !scope.showFilter;
        };
        scope.$watch('currentTerm', function() {
          scope.retrieveChartquery();
        });
        var isFirst = true;
        scope.$watch('demographic', function() {
          if(isFirst) {
            isFirst = false;
          } else {
            scope.retrieveChartquery();
          }
        });
        //Transform the query, replaceing any schoolId and date variables, if any
        var regexValues = {
          '${schoolId}': statebag.school.id,
          '${startDate}': statebag.currentYear.startDate,
          '${endDate}': statebag.currentYear.endDate,
          '${clickValue}': null,
          '${clickValueMin}': null,
          '${clickValueMax}': null
        };
        var RACE_DIM = {
          dimension: 'STUDENT',
          field: 'Race'
        };

        var GENDER_DIM = {
          dimension: 'STUDENT',
          field: 'Gender'
        };

        var ETHNICITY_DIM = {
          dimension: 'STUDENT',
          field: 'Ethnicity'
        };

        var ELL_DIM = {
          dimension: 'STUDENT',
          field: 'ELL'
        };
        var SPED_DIM = {
          dimension: 'STUDENT',
          field: 'Special Ed.'
        };
        var DEMOGRAPHIC_TO_DIM = {
          'Race': RACE_DIM,
          'Gender': GENDER_DIM,
          'Ethnicity': ETHNICITY_DIM,
          'ELL': ELL_DIM,
          'SPED': SPED_DIM
        };

        scope.resolveChartResultsFromObject = function (resultsObject, xAxis) {
          var resultsArray = [];
          if(scope.demographic === 'Race') {
            angular.forEach(resultsObject, function(value, key) {
              var currArray = [];
              var raceString = consts.raceMap[key];
              if(!raceString) {
                raceString = 'Unknown';
              }
              currArray.push(raceString);
              currArray = currArray.concat(value);
              while(currArray.length < xAxis.length) {
                currArray.push(0);
              }
              resultsArray.push(currArray);
            });
          } else if(scope.demographic === 'Gender') {
            angular.forEach(resultsObject, function(value, key) {
              var currArray = [];
              if(key === 0) {
                currArray.push('Male');
              } else if( key === 1) {
                currArray.push('Female');
              } else if(key === 2) {
                currArray.push('Unknown');
              }
              currArray = currArray.concat(value);
              while(currArray.length < xAxis.length) {
                currArray.push(0);
              }
              resultsArray.push(currArray);
            });
          } else if(scope.demographic === 'ELL') {
            angular.forEach(resultsObject, function(value, key) {
              var currArray = [];
              if(key === 'false') {
                currArray.push('Non-ELL');
              } else if( key === 'true') {
                currArray.push('ELL');
              } else {
                currArray.push('Unknown');
              }
              currArray = currArray.concat(value);
              while(currArray.length < xAxis.length) {
                currArray.push(0);
              }
              resultsArray.push(currArray);
            });
          } else if(scope.demographic === 'SPED') {
            angular.forEach(resultsObject, function(value, key) {
              var currArray = [];
              if(key === 'false') {
                currArray.push('Non-SPED');
              } else if( key === 'true') {
                currArray.push('SPED');
              } else {
                currArray.push('Unknown');
              }
              currArray = currArray.concat(value);
              while(currArray.length < xAxis.length) {
                currArray.push(0);
              }
              resultsArray.push(currArray);
            });
          } else {
            angular.forEach(resultsObject, function(value, key) {
              var currArray = [];
              currArray.push(key);
              currArray = currArray.concat(value);
              while(currArray.length < xAxis.length) {
                currArray.push(0);
              }
              resultsArray.push(currArray);
            });
          }
          resultsArray.push(xAxis);
          return resultsArray;
        };

        scope.yearWeekToDateString = function(yearWeek) {
          var year = Math.round(yearWeek/100);
          var week = Number(yearWeek.toString().substring(4)) + 1;
          var dt = $window.moment().year(year).week(week).format('YYYY-MM-DD');
          return dt;
        };

        var ALL_STUDENTS = "All students";
        var SPED = "SPED students";
        var ELL = "ELL students";
        var MALE = "Male students";
        var FEMALE =  "Female students";
        var NEW_TO_DISTRICT = "Students new to district";



        /*
            ASSIGNMENT CHART SUBTYPE METHODS
         */
        scope.toggleRadioButtons = function() {
          scope.showRadioButtons = !scope.showRadioButtons;
        };

        scope.calculateHistogramResults = function() {
          var filter = scope.studentToggle;
          var min = 100;
          var max = 0;
          var scores = ["Score", "<50%", "50-60%", "60-70%", "70-80%", "80-90%", "90-100%", "100-110%", "110%+"];
          var numberOf = ["Number of Students", 0, 0, 0, 0, 0, 0, 0, 0];
          var count = 0;
          var allValidResults = [];
          for(var i = 0; i < scope.assignmentAnalysisResults.results.length; i++){
            var entry = scope.assignmentAnalysisResults.results[i];
            var s = entry.student;
            //If the record should be filtered out, filter it out
            if(filter === SPED && !s.sped) {
              continue;
            } else if(filter === ELL && !s.ell) {
              continue
            } else if(filter === MALE && s.gender !== 'MALE') {
              continue;
            } else if(filter === FEMALE && s.gender !== 'FEMALE') {
              continue;
            } else if(filter === NEW_TO_DISTRICT && s.previousSchoolId) {
              continue;
            }
            var val = entry.score * 100;
            allValidResults.push(val);
            count++;
            if(val < min) {
              min = val;
            }
            if(val > max) {
              max = val;
            }
            if(val < 50) {
              numberOf[1]++;
            } else if(val < 60) {
              numberOf[2]++;
            } else if(val < 70) {
              numberOf[3]++;
            } else if(val < 80) {
              numberOf[4]++;
            } else if(val < 90) {
              numberOf[5]++;
            } else if(val < 100) {
              numberOf[6]++;
            } else if(val < 110) {
              numberOf[7]++;
            } else {
              numberOf[8]++;
            }
          }
          var medianPos = Math.round((count-1)/2);
          var q1Pos = Math.round(medianPos / 2);
          var q3Pos = medianPos + q1Pos;
          var q1 = Math.round(allValidResults[q1Pos]);
          var q3 = Math.round(allValidResults[q3Pos]);
          var med = Math.round(allValidResults[medianPos]);
          if(count < 4) {
            q1 = '--';
            q3 = '--';
          }
          if(count < 3) {
            med = '--';
          }
          scope.quartiles = {
            min: Math.round(min),
            quartile1: q1,
            median: med,
            quartile3: q3,
            max: Math.round(max)
          };
          scope.newData = [numberOf, scores];
        };

        scope.retrieveAssignmentAnalysisResults = function() {
          scope.studentToggle = ALL_STUDENTS;
          api.assignmentAnalysis.post(
            { schoolId: statebag.school.id },
            scope.report.assignmentIds,
            function(results) {
              scope.assignmentAnalysisResults = results;
              scope.calculateHistogramResults();
              scope.quartiles = {
                min: Math.round(results.min * 100),
                quartile1: Math.round(results.quartile1 * 100),
                median: Math.round(results.median * 100),
                quartile3: Math.round(results.quartile3 * 100),
                max: Math.round(results.max * 100)
              };
              scope.$watch('studentToggle', function(newVal, oldVal){
                if(newVal && !angular.equals(newVal, oldVal)) {
                  scope.showRadioButtons = false;
                  scope.calculateHistogramResults();
                }
              });
              scope.toggleData = [
                ALL_STUDENTS,
                SPED,
                ELL,
                MALE,
                FEMALE,
                NEW_TO_DISTRICT
              ];
            },
            function(){
              //TODO: toast
            });
        };

        scope.histogramCallback = function(callbackVal) {
          console.log('called back on the histogram');
        };

        /*
         * GENERAL REPORT TYPE METHODS
         */
        scope.retrieveChartquery = function() {
          if(scope.report.type === 'assignment_analysis' || scope.report.type === 'ASSIGNMENT_ANALYSIS') {
            scope.retrieveAssignmentAnalysisResults();
            return;
          }

          scope.usableQuery = angular.copy(scope.report.chartQuery);
          scope.dataDeferred = $q.defer();
          scope.dataPromise = scope.dataDeferred.promise;

          regexValues['${startDate}'] = scope.currentTerm.startDate;
          regexValues['${endDate}'] = scope.currentTerm.endDate;
          //Replace placeholders with state values, if any
          if(scope.usableQuery.filter) {
            scope.replacePlaceholders(scope.usableQuery.filter);
          }
          //If there is a demographic selected on the chart, add that to the query dimensions
          if(scope.demographic) {
            var demographicDim = DEMOGRAPHIC_TO_DIM[scope.demographic];
            if(demographicDim) {
              if(!scope.usableQuery.fields) {
                scope.usableQuery.fields = [];
              }
              scope.usableQuery.fields.push(DEMOGRAPHIC_TO_DIM[scope.demographic]);
              var colsByPos = scope.usableQuery.subqueryColumnsByPosition;
              if(colsByPos) {
                for(var q = 0; q < colsByPos.length; q++) {
                  if(colsByPos[q].position >= scope.usableQuery.fields.length - 1) {
                    colsByPos[q].position++;
                  }
                }
                scope.usableQuery.subqueryColumnsByPosition.splice(1, 0, {position: scope.usableQuery.fields.length - 1});
                //scope.usableQuery.subqueryColumnsByPosition.push({position: scope.usableQuery.fields.length - 1});
              }
            }
          }
          scope.chartData = [];
          if(scope.usableQuery.aggregateMeasures) {
            for(var i = 0; i < scope.usableQuery.aggregateMeasures.length; i++) {
              var meas = scope.usableQuery.aggregateMeasures[i];
              if(meas.buckets) {
                scope.chartData.push([ meas.aggregation.toLowerCase() + ' ' + meas.measure.toLowerCase() + 's' ]);
              }
              scope.chartData.push([meas.measure.toLowerCase() + 's']);
            }
          }
          if(scope.usableQuery.fields) {
            for(var j = 0; j < scope.usableQuery.fields.length; j++) {
              var field = ' ' + scope.usableQuery.fields[j].field.toLowerCase();
              if(field === ' id') {
                field = '';
              }
              scope.chartData.push([
                scope.usableQuery.fields[j].dimension.toLowerCase() + field + 's' ]);
            }
          }
          //Fire off the initial chart query
          api.query.save(
            { schoolId: statebag.school.id },
            scope.usableQuery,
            function(results) {
              scope.initialResults = results;
              var records = results.records;
              if(records.length === 0) {
                return;
              }
              var xPosition = 0;
              var yPosition = records[0].values.length - 1;
              var seriesPosition = null;
              if(yPosition > 1 && scope.usableQuery.aggregateMeasures.length === 1) {
                seriesPosition = yPosition - 1;
              }

              if(seriesPosition) {
                if(scope.usableQuery.aggregateMeasures.length + scope.usableQuery.fields.length === 2) {
                  var tmp = xPosition;
                  xPosition = seriesPosition;
                  seriesPosition = tmp;
                }
                var resultsObject = {};
                var xAxis = ['counts'];
                var singleRow = null;
                if(scope.usableQuery.aggregateMeasures &&
                  scope.usableQuery.aggregateMeasures[0].buckets &&
                  !scope.usableQuery.aggregateMeasures[0].bucketAggregation) {
                  for(var i = 0; i < scope.usableQuery.aggregateMeasures[0].buckets.length; i++) {
                    xAxis.push(scope.usableQuery.aggregateMeasures[0].buckets[i].label);
                  }
                  for (var k = 0; k < records.length; k++) {
                    singleRow = records[k].values;
                    if (!resultsObject[singleRow[seriesPosition]]) {
                      resultsObject[singleRow[seriesPosition]] = [];
                      while(resultsObject[singleRow[seriesPosition]].length < xAxis.length) {
                        resultsObject[singleRow[seriesPosition]].push(0);
                      }
                    }
                    var bucketPos = xAxis.indexOf(singleRow[xPosition]) - 1;
                    resultsObject[singleRow[seriesPosition]][bucketPos] = singleRow[yPosition];
                  }
                } else {
                  var isWeek = false;
                  if(200000 < records[0].values[xPosition] && 300000 > records[0].values[xPosition]) {
                    isWeek = true;
                  }
                  for (var l = 0; l < records.length; l++) {
                    //If the query has buckets, resolve the x-axis array
                    singleRow = records[l].values;
                    if (!resultsObject[singleRow[seriesPosition]]) {
                      resultsObject[singleRow[seriesPosition]] = [];
                    }

                    if(isWeek) {
                      var dateString = scope.yearWeekToDateString(singleRow[xPosition]);
                      if(xAxis.indexOf(dateString) === -1) {
                        xAxis.push(dateString);
                      }
                      while (resultsObject[singleRow[seriesPosition]].length < xAxis.length - 1) {
                        resultsObject[singleRow[seriesPosition]].push(0);
                      }
                      resultsObject
                        [singleRow[seriesPosition]]
                        [xAxis.indexOf(scope.yearWeekToDateString(singleRow[xPosition])) - 1] = singleRow[yPosition];
                    } else {
                      while (xAxis.length <= singleRow[xPosition] + 1) {
                        xAxis.push(xAxis.length - 1);
                      }
                      while (resultsObject[singleRow[seriesPosition]].length < xAxis.length - 1) {
                        resultsObject[singleRow[seriesPosition]].push(0);
                      }
                      resultsObject[singleRow[seriesPosition]][singleRow[xPosition]] = singleRow[yPosition];
                    }
                  }
                }
                scope.chartData = scope.resolveChartResultsFromObject(resultsObject, xAxis);
              } else {
                //Handle the whittling down of the results array based on the subquery columns selected, if there are any
                if(scope.usableQuery.subqueryColumnsByPosition) {
                  var newChartDataArray = [];
                  for(var s = 0; s < scope.usableQuery.subqueryColumnsByPosition.length; s++) {
                    var curr = scope.usableQuery.subqueryColumnsByPosition[s];
                    if(curr.position === -1) {
                      newChartDataArray.push(scope.chartData[0]);
                    } else {
                      newChartDataArray.push(scope.chartData[curr.position]);
                    }
                  }
                  scope.chartData = newChartDataArray;
                }
                for (var z = 0; z < results.records.length; z++) {
                  var row = results.records[z].values;
                  var len = scope.chartData.length;
                  for (var j = 0; j < len; j++) {
                    if (j === 0) {
                      scope.chartData[len - 1].push(row[xPosition]);
                    } else {
                      scope.chartData[j - 1].push(row[j]);
                    }
                  }
                }
              }
              scope.newData = scope.chartData;
            }
          );
        };
        /**
         * Replaces placeholder operands in a query expression with the literal operand
         * using the current state values.
         * @param exp
         */
        scope.replacePlaceholders = function(exp) {
          if(!exp || !exp.leftHandSide || !exp.rightHandSide) {
            return;
          }
          if(exp.leftHandSide.type === 'EXPRESSION') {
            scope.replacePlaceholders(exp.leftHandSide);
          }
          if(exp.rightHandSide.type === 'EXPRESSION'){
            scope.replacePlaceholders(exp.rightHandSide);
          }
          //LHS
          if(exp.leftHandSide.type === 'PLACEHOLDER_NUMERIC') {
            exp.leftHandSide = { 'type': 'NUMERIC', 'value': regexValues[exp.leftHandSide.value] };
          } else if(exp.leftHandSide.type === 'PLACEHOLDER_STRING') {
            exp.leftHandSide = { 'type': 'STRING', 'value': regexValues[exp.leftHandSide.value] };
          } else if(exp.leftHandSide.type === 'PLACEHOLDER_DATE') {
            exp.leftHandSide = { 'type': 'DATE', 'value': regexValues[exp.leftHandSide.value] };
          }
          //RHS
          if(exp.rightHandSide.type === 'PLACEHOLDER_NUMERIC') {
            exp.rightHandSide = { 'type': 'NUMERIC', 'value': regexValues[exp.rightHandSide.value] };
          } else if(exp.rightHandSide.type === 'PLACEHOLDER_STRING') {
            exp.rightHandSide = { 'type': 'STRING', 'value': regexValues[exp.rightHandSide.value] };
          } else if(exp.rightHandSide.type === 'PLACEHOLDER_DATE') {
            exp.rightHandSide = { 'type': 'DATE', 'value': regexValues[exp.rightHandSide.value] };
          }
        };

        var resolveRegexReplaceValues = function(d) {
          var index = d.index;
          var xVal = scope.chartData[scope.chartData.length - 1][index + 1];
          //you're always looking to define the grouped by field
          if(typeof xVal === 'string' &&
              scope.usableQuery.aggregateMeasures &&
              scope.usableQuery.aggregateMeasures[0].buckets) {
            //resolve the min & max for the bucket and set it
            regexValues['${clickValueMin}'] = scope.usableQuery.aggregateMeasures[0].buckets[index].start;
            regexValues['${clickValueMax}'] = scope.usableQuery.aggregateMeasures[0].buckets[index].end;
            regexValues['${clickValue}'] = null;
          } else {
            regexValues['${clickValue}'] = xVal;
            regexValues['${clickValueMin}'] = null;
            regexValues['${clickValueMax}'] = null;
          }
        };
        /**
         * Closes a detail table view on the chart, if any
         */
        scope.slideClosed = function() {
          if(scope.referralDetailScope) {
            scope.referralDetailScope.$destroy();
          }
          scope.tableContainer.empty();
        };
        /**
         * When a chart secetion is clicked, this callback is called.  A new query for granular
         * data is fired off to the server and then rendered onto the page as a table view.
         * @param d
         * @param element
         */
        scope.clickCallback = function(d, element) {
          if(scope.report.clickTableQuery) {
            var clickQuery = angular.copy(scope.report.clickTableQuery);
            resolveRegexReplaceValues(d);
            if(clickQuery.filter) {
              scope.replacePlaceholders(clickQuery.filter);
            }
            if(clickQuery.having) {
              scope.replacePlaceholders(clickQuery.having);
            }
            api.query.save(
              { schoolId: statebag.school.id },
              clickQuery,
              function(results){
                var container = angular.element(element).closest('.report-container');
                scope.tableContainer = container.find('.details-table');
                var html = '<md-button ng-click="slideClosed()" aria-label="close" class="close-cal md-icon-button">' +
                  '<md-icon md-font-set="material-icons">close</md-icon>' +
                  '</md-button>' +
                  '<div ui-grid="tableConfig" ui-grid-pagination class=""></div>';
                scope.slideClosed();
                scope.referralDetailScope = scope.$new();
                scope.referralDetailScope.referralsData = results.records;
                scope.referralDetailScope.tableConfig = {
                  data: 'referralsData',
                  enableColumnMenus: false,
                  paginationPageSize: 8,
                  paginationPageSizes: [8, 20, 50, 100],
                  enablePaginationControls: true,
                  columnDefs: scope.report.columnDefs
                };
                var compiledHtml = $compile(html)(scope.referralDetailScope);
                scope.tableContainer.append(compiledHtml);
              }
            );
          }
        };
      }
    };
  }]);
