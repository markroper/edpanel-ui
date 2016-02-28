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
        scope.$watch('demographic', function(newVal, oldVal) {
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

        /**
         * Results come back in the form:
         * [
         *  [3, 'black', 3],
         *  [2, 'asian', 2],
         *  [3, 'white', 3],
         *  ...
         * ]
         *
         * and need to br transformed into the chart ready format:
         * [
         *  ['black', 0, 0, 3 ...],
         *  ['asian' 0, 0, 2 ...],
         *  ['white', 0, 0, 3 ...],
         *  ['count', 0, 1, 2, 3]
         * ]
         *
         * This method does the transformation.
         *
         * @param resultSet
         * @returns {Array}
         */
        var transformResultsForDemographic = function(resultSet) {
          var resultsObject = {};
          var xAxis = ['counts'];
          var demoPosition = 0;
          var aggPosition = 1;
          if(scope.usableQuery.subqueryColumnsByPosition) {
            demoPosition = 1;
            aggPosition = 0;
          }
          if(scope.usableQuery.aggregateMeasures && scope.usableQuery.aggregateMeasures[0].buckets) {
            for(var i = 0; i < scope.usableQuery.aggregateMeasures[0].buckets.length; i++) {
              xAxis.push(scope.usableQuery.aggregateMeasures[0].buckets[i].label);
            }
            for (var i = 0; i < resultSet.records.length; i++) {
              var singleRow = resultSet.records[i].values;
              if (!resultsObject[singleRow[demoPosition]]) {
                resultsObject[singleRow[demoPosition]] = [];
                while(resultsObject[singleRow[demoPosition]].length < xAxis.length) {
                  resultsObject[singleRow[demoPosition]].push(0);
                }
              }
              var bucketPos = xAxis.indexOf(singleRow[2]) - 1;
              resultsObject[singleRow[demoPosition]][bucketPos] = singleRow[aggPosition];
            }
          } else {
            for (var i = 0; i < resultSet.records.length; i++) {
              //If the query has buckets, resolve the x-axis array
              var singleRow = resultSet.records[i].values;
              if (!resultsObject[singleRow[demoPosition]]) {
                resultsObject[singleRow[demoPosition]] = [];
              }
              while (xAxis.length <= singleRow[2] + 1) {
                xAxis.push(xAxis.length - 1);
              }
              while (resultsObject[singleRow[demoPosition]].length < singleRow[2]) {
                resultsObject[singleRow[demoPosition]].push(0);
              }
              resultsObject[singleRow[demoPosition]][singleRow[2]] = singleRow[aggPosition];
            }
          }

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
              if(key == 0) {
                currArray.push('Male');
              } else if( key == 1) {
                currArray.push('Female');
              } else if(key == 2) {
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
          }
          resultsArray.push(xAxis);
          return resultsArray;
        }

        /**
         * makes the initial request for data and resolves the promise with the chart data
         */
        scope.retrieveChartquery = function(isUpdate) {
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
                var lastCol = colsByPos[colsByPos.length - 1];
                scope.usableQuery.subqueryColumnsByPosition.push({position: lastCol.position + 1});
              }
            }
          }
          scope.chartData = [];
          if(scope.usableQuery.aggregateMeasures) {
            for(var i = 0; i < scope.usableQuery.aggregateMeasures.length; i++) {
              var meas = scope.usableQuery.aggregateMeasures[i];
              scope.chartData.push([ meas.measure.toLowerCase() + 's' ]);
              if(meas.buckets) {
                scope.chartData.push([ meas.aggregation.toLowerCase() + ' ' + meas.measure.toLowerCase() + 's' ]);
              }
            }
          }
          if(scope.usableQuery.fields) {
            for(var i = 0; i < scope.usableQuery.fields.length; i++) {
              scope.chartData.push([ scope.usableQuery.fields[i].dimension.toLowerCase() + 's' ]);
            }
          }

          //Fire off the initial chart query
          api.query.save(
            { schoolId: statebag.school.id },
            scope.usableQuery,
            function(results) {
              scope.initialResults = results;
              if (scope.demographic) {
                scope.chartData = scope.initialResults = transformResultsForDemographic(scope.initialResults);
              } else {
                for (var i = 0; i < results.records.length; i++) {
                  var row = results.records[i].values;
                  var len = scope.chartData.length;
                  for (var j = 0; j < len; j++) {
                    if (j === 0) {
                      scope.chartData[len - 1].push(row[0]);
                    } else {
                      scope.chartData[j - 1].push(row[j]);
                    }
                  }
                }
                //If the first array contains strings, we're dealing with a bucketed query and need to swap positions
                if (typeof scope.chartData[0][scope.chartData[0].length - 1] === 'string') {
                  scope.chartData.reverse();
                }
                //Deal with subquery columns, if any
                if (scope.usableQuery.subqueryColumnsByPosition) {
                  var newChartData = [];
                  var bucketOffset = 0;
                  for (var j = 0; j < scope.usableQuery.aggregateMeasures.length; j++) {
                    if (scope.usableQuery.aggregateMeasures[j].buckets) {
                      bucketOffset++;
                    }
                  }
                  for (var i = 0; i < scope.usableQuery.subqueryColumnsByPosition.length; i++) {
                    var pos = scope.usableQuery.subqueryColumnsByPosition[i].position;
                    if (pos === -1) {
                      newChartData.unshift(scope.chartData[0]);
                    } else {
                      pos = pos - bucketOffset;
                      newChartData.unshift(scope.chartData[pos]);
                    }
                  }
                  scope.chartData = newChartData;
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
          if(exp.leftHandSide.type === 'EXPRESSION') {
            scope.replacePlaceholders(exp.leftHandSide);
          }
          if(exp.rightHandSide.type === 'EXPRESSION'){
            scope.replacePlaceholders(exp.rightHandSide);
          }
          //LHS
          if(exp.leftHandSide.type === 'PLACEHOLDER_NUMERIC') {
            exp.leftHandSide = { 'type': 'NUMERIC', 'value': regexValues[exp.leftHandSide.value] }
          } else if(exp.leftHandSide.type === 'PLACEHOLDER_STRING') {
            exp.leftHandSide = { 'type': 'STRING', 'value': regexValues[exp.leftHandSide.value] }
          } else if(exp.leftHandSide.type === 'PLACEHOLDER_DATE') {
            exp.leftHandSide = { 'type': 'DATE', 'value': regexValues[exp.leftHandSide.value] }
          }
          //RHS
          if(exp.rightHandSide.type === 'PLACEHOLDER_NUMERIC') {
            exp.rightHandSide = { 'type': 'NUMERIC', 'value': regexValues[exp.rightHandSide.value] }
          } else if(exp.rightHandSide.type === 'PLACEHOLDER_STRING') {
            exp.rightHandSide = { 'type': 'STRING', 'value': regexValues[exp.rightHandSide.value] }
          } else if(exp.rightHandSide.type === 'PLACEHOLDER_DATE') {
            exp.rightHandSide = { 'type': 'DATE', 'value': regexValues[exp.rightHandSide.value] }
          }
        }

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
