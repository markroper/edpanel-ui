'use strict';
angular.module('teacherdashboard')
  .directive('edpanelReport', [ '$window', 'api', 'statebag', '$q', function($window, api, statebag, $q) {
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
        //Transform the query, replaceing any schoolId and date variables, if any
        scope.usableQuery = angular.copy(scope.report.chartQuery);
        var regexValues = {
          '${schoolId}': statebag.school.id,
          '${startDate}': statebag.currentYear.startDate,
          '${endDate}': statebag.currentYear.endDate
        }

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
            scope.chartData.push([ scope.usableQuery.aggregateMeasures[i].measure.toLowerCase() ]);
          }
        }

        if(scope.usableQuery.fields) {
          for(var i = 0; i < scope.usableQuery.fields.length; i++) {
            scope.chartData.push([ scope.usableQuery.fields[i].dimension.toLowerCase() ]);
          }
        }

        //Fire off the query.
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
              //lastIndex = row[1];

            }
            scope.dataDeferred.resolve(scope.chartData);

          }
        );

        //Click callback...

      }
    };
  }]);
