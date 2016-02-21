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
        scope.dataDeferred = $q.defer();
        scope.dataPromise = scope.dataDeferred.promise;
        //Transform the query, replaceing any schoolId and date variables, if any
        scope.usableQuery = angular.copy(scope.report.chartQuery);
        var regexValues = {
          '${schoolId}': statebag.school.id,
          '${startDate}': statebag.currentYear.startDate,
          '${endDate}': statebag.currentYear.endDate,
          '${clickValue}': null,
          '${clickValueMin}': null,
          '${clickValueMax}': null
        };
        var replacePlaceholders = function(exp) {
          if(exp.leftHandSide.type === 'EXPRESSION') {
            replacePlaceholders(exp.leftHandSide);
          }
          if(exp.rightHandSide.type === 'EXPRESSION'){
            replacePlaceholders(exp.rightHandSide);
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
        if(scope.usableQuery.filter) {
          replacePlaceholders(scope.usableQuery.filter);
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
            scope.dataDeferred.resolve(scope.chartData);

          }
        );
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
        scope.slideClosed = function() {
          if(scope.referralDetailScope) {
            scope.referralDetailScope.$destroy();
          }
          scope.tableContainer.empty();
        };
        scope.clickCallback = function(d, element) {
          if(scope.report.clickTableQuery) {
            var clickQuery = angular.copy(scope.report.clickTableQuery);
            resolveRegexReplaceValues(d);
            if(clickQuery.filter) {
              replacePlaceholders(clickQuery.filter);
            }
            if(clickQuery.having) {
              replacePlaceholders(clickQuery.having);
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
