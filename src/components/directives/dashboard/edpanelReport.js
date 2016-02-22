'use strict';
angular.module('teacherdashboard')
  .directive('edpanelReport', [ '$window', 'api', 'statebag', '$q', '$compile', function($window, api, statebag, $q, $compile) {
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
        scope.currentTerm = scope.terms[0];
        scope.showDemoMenu = false;
        var speedDial =
          '<md-fab-speed-dial class="demographics" class="md-fab-bottom-right md-scale" md-direction="left" >' +
          '  <md-fab-trigger>' +
          '  <md-button aria-label="menu" class="md-icon-button">' +
          ' <md-icon md-font-set="material-icons">settings</md-icon>' +
          '  <md-tooltip>chart settings</md-tooltip>' +
          '</md-button>' +
          '</md-fab-trigger>' +
          '<md-fab-actions>' +
          '<div class="row">' +
          '  <span>View breakdown by</span>' +
          '<md-input-container style="margin-right: 10px;">' +
          '  <md-select ng-model="demographic">' +
          '  <md-option  value="Race">Race</md-option>' +
          '  <md-option  value="Gender">Gender</md-option>' +
          '  <md-option ng-disabled value="Ell">ELL</md-option>' +
          '  <md-option ng-disabled value="Sped">Special Ed</md-option>' +
          '</md-select>' +
          '</md-input-container>' +
          '</div>' +
          '</md-fab-actions>' +
          '</md-fab-speed-dial>';
        var compiledDial = $compile(speedDial)(scope);
        //TODO: get this to work
        //angular.element(elem).find('.demographic-parent').append(compiledDial);

        var isFirst = true;
        scope.$watch('currentTerm', function(oldVal, newVal) {
          scope.retrieveChartquery();
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

        scope.demographic = null;
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
        var DEMOGRAPHIC_TO_DIM = {
          'Race': RACE_DIM,
          'Gender': GENDER_DIM,
          'Ethnicity': ETHNICITY_DIM
        };

        var transformResultsForDemographic = function(resultSet) {
          //TODO: implement
          return resultSet;
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
              scope.usableQuery.fields.push(DEMOGRAPHIC_TO_DIM[scope.demographic]);
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
              if(scope.demographic) {
                scope.initialResults = transformResultsForDemographic(scope.initialResults);
              }
              for (var i = 0; i < results.records.length; i++) {
                var row = results.records[i].values;
                var len = scope.chartData.length;
                for(var j = 0; j < len; j++) {
                  if(j === 0) {
                    scope.chartData[len - 1].push(row[0]);
                  } else {
                    scope.chartData[j - 1].push(row[j]);
                  }
                }
              }
              //If the first array contains strings, we're dealing with a bucketed query and need to swap positions
              if(typeof scope.chartData[0][scope.chartData[0].length - 1] === 'string') {
                scope.chartData.reverse();
              }
              //Deal with subquery columns, if any
              if(scope.usableQuery.subqueryColumnsByPosition) {
                var newChartData = [];
                var bucketOffset = 0;
                for(var j = 0; j < scope.usableQuery.aggregateMeasures.length; j++) {
                  if(scope.usableQuery.aggregateMeasures[j].buckets) {
                    bucketOffset++;
                  }
                }
                for(var i = 0; i < scope.usableQuery.subqueryColumnsByPosition.length; i++) {
                  var pos = scope.usableQuery.subqueryColumnsByPosition[i].position;
                  if(pos === -1) {
                    newChartData.unshift(scope.chartData[0]);
                  } else {
                    pos = pos - bucketOffset;
                    newChartData.unshift(scope.chartData[pos]);
                  }
                }
                scope.chartData = newChartData;
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
        ////Initial load
        //scope.retrieveChartquery();
      }
    };
  }]);
