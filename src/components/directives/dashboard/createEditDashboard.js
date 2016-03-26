'use strict';

var DialogController = function($scope, $mdDialog) {
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
    //TODO: call API to create the report?
  };
};

angular.module('teacherdashboard')
  .directive('createEditDashboard', [ '$window', 'api', '$mdDialog', '$mdMedia', 'statebag', 'consts', 'dijkstra', '$mdToast', '$document',
  function($window, api, $mdDialog, $mdMedia, statebag, consts, dijkstra, $mdToast, $document) {
    return {
      scope: {
        dashboard: '=',
        terms: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditDashboard.html',
      replace: true,
      link: function(scope){
        scope.xMenu = { isOpen: false };
        scope.dimensions = [];
        scope.dimensionFields = {};
        scope.measures = [];
        scope.measureFields = {};

        api.queryComponents.get(
          { schoolId: statebag.school.id },
          //Success callback
          function(data){
            scope.queryComponents = data;
            scope.processQueryComponents();
          },
          //Error callback
          function(){
            console.log('failed to resolve the school!');
          });

        scope.gridsterOpts = {
          columns: 6,
          swapping: true,
          pushing: true,
          minSizeX: 2,
          maxSizeX: 6,
          minSizeY: 1,
          maxSizeY: 1,
          mobileBreakPoint: 800,
          draggable: {
            enabled: true,
            handle: '.chart-type'
          }
        };

        scope.dashboardReports = [];
        scope.$watch(
          'dashboard',
          function( newValue, oldValue ) {
            if(newValue && !angular.equals(newValue, oldValue)) {
              scope.dashboardReports = scope.processDashboard();
            }
          }
        );
        scope.$watch(
          '$parent.d.editDashboard',
          function( newValue ) {
            if(newValue) {
              scope.dashboardReports = scope.processDashboard();
            }
          }
        );

        scope.processQueryComponents = function() {
          scope.dimensions = [];
          scope.dimensionFields = {};
          scope.measures = [];
          scope.measureFields = {};
          for (var j = 0; j < scope.queryComponents.availableDimensions.length; j++) {
            var dim = angular.copy(scope.queryComponents.availableDimensions[j]);
            if (!dim.fields) {
              dim.fields = [];
            }
            dim.fields = dim.fields.concat(consts.aggregations);
            scope.dimensions.push(dim.type.toLowerCase());
            scope.dimensionFields[dim.type.toLowerCase()] = dim;
          }
          for (var k = 0; k < scope.queryComponents.availableMeasures.length; k++) {
            var meas = scope.queryComponents.availableMeasures[k];
            if (!meas.fields) {
              meas.fields = [];
            }
            meas.fields = consts.aggregations.concat(meas.fields);
            scope.measures.push(meas.measure.toLowerCase());
            scope.measureFields[meas.measure.toLowerCase()] = meas;
          }
        };

        //Given the currently selected X and Y axis values, generate the complete set of eligible filter fields
        scope.generateTableGraph = function() {
          var g = new dijkstra.Graph();
          var edges = {};
          for (var l = 0; l < scope.queryComponents.availableDimensions.length; l++) {
            var dim = scope.queryComponents.availableDimensions[l];
            edges = {};
            if (dim.parentDimensions) {
              for (var m = 0; m < dim.parentDimensions.length; m++) {
                edges[dim.parentDimensions[m]] = 1;
              }
            }
            g.addVertex(dim.type, edges);
          }
          for (var n = 0; n < scope.queryComponents.availableMeasures.length; n++) {
            var meas = scope.queryComponents.availableMeasures[n];
            edges = {};
            if (meas.compatibleDimensions) {
              for (var o = 0; o < meas.compatibleDimensions.length; o++) {
                edges[meas.compatibleDimensions[o]] = 1;
              }
              for (var p = 0; p < meas.compatibleDimensions.length; p++) {
                edges[meas.compatibleMeasures[p]] = 1;
              }
            }
            g.addVertex(meas.measure, edges);
          }
          return g;
        };

        scope.resolveRhsType = function(input) {
          //Figure out the data type of the RHS user entered value
          var rhsType = consts.placeholderValues[input];
          if(!rhsType) {
            if(input.toLowerCase && input.toLowerCase().indexOf(' date') !== -1) {
              rhsType = 'DATE';
            }
            if(isNaN(input)) {
              rhsType = 'STRING';
            } else {
              rhsType = 'NUMERIC';
            }
          }
          return rhsType;
        };

        scope.resolveLhs = function(field) {
          var lhs = {};
          if(scope.measures.indexOf(field.table.toLowerCase()) !== -1) {
            lhs.type = 'MEASURE';
            lhs.value = {
              bucketAggregation: null,
              buckets: null,
              field: field.field,
              measure: field.table.toUpperCase()
            };
          } else {
            lhs.type = 'DIMENSION';
            lhs.value = {
              dimension: field.table.toUpperCase(),
              field: field.field
            };
          }
          return lhs;
        };

        scope.editReport = function(ev, rpt) {
          var sc = scope.$new();
          sc.api = api;
          sc.theme = statebag.theme;
          sc.report = rpt;
          sc.dimensions = sc.dimensions;
          sc.dimensionFields = scope.dimensionFields;
          sc.measures = scope.measures;
          sc.measureFields = scope.measureFields;
          sc.tablesGraph = scope.generateTableGraph();
          sc.terms = scope.terms;
          sc.queryInProgress = {};
          $mdDialog.show({
            scope: sc,
            controller: DialogController,
            templateUrl: api.basePrefix + '/components/directives/dashboard/reportBuilderDialog.html',
            parent: angular.element($document.body),
            targetEvent: ev,
            openFrom: ev.el,
            closeTo: ev.el,
            clickOutsideToClose:true
          }).then(function() {
            sc.report.chartQuery = scope.produceQueryFromQueryInProgress(sc.queryInProgress);
            var clickTableQuery = scope.produceClickQuery(sc.report.chartQuery);
            if(clickTableQuery) {
              sc.report.clickTableQuery = clickTableQuery;
              sc.report.supportDemographicFilter = true;
              sc.report.columnDefs = [
                { field: 'values[1]', displayName: 'Name' },
                { field: 'values[2]', displayName: '' }
              ];
            }
          }, function() {
            scope.status = 'You cancelled the dialog.';
          });
        };

        scope.setDefaultTypeOnBuckets = function(buckets) {
          if(buckets) {
            for(var w = 0; w < buckets.length; w++) {
              var buck = buckets[w];
              if(!buck.type) {
                buck.type = 'NUMERIC';
              }
            }
          }
        };
        /**
         * Given the base query for a report, this method produces the click-through query and returns
         * null if there is no valid click-through query.  Click through is only supported for queries
         * related to students.
         *
         * @param baseQuery
         * @returns {*}
         */
        scope.produceClickQuery = function(baseQuery) {
          var studentFieldPos = undefined;
          if(baseQuery.fields) {
            for(var i = 0; i < baseQuery.fields.length; i++) {
              var dim = baseQuery.fields[i];
              if(dim.dimension === 'STUDENT') {
                studentFieldPos = i;
                break;
              }
            }
          }
          if(studentFieldPos === undefined) {
            return null;
          }
          if(!baseQuery.aggregateMeasures) {
            return null;
          }

          //OK, we have a query with a student and we know where the student field is in the query.fields array
          //Now we resolve whether or not the student field is on the x or the y axis in the chart:
          var clickQuery = {};
          clickQuery.schoolId = baseQuery.schoolId;
          //Resolve the click query dimensions and measures:
          clickQuery.fields = [];
          clickQuery.fields.push({ dimension: 'STUDENT', field: 'ID' });
          clickQuery.fields.push({ dimension: 'STUDENT', field: 'Name' });
          clickQuery.aggregateMeasures = [];
          if(baseQuery.aggregateMeasures) {
            var m = angular.copy(baseQuery.aggregateMeasures[0]);
            m.buckets = null;
            m.bucketAggregation = null;
            clickQuery.aggregateMeasures.push(m)
          } else {
            //TODO: there were no aggregate measures in the query... is this a valid case?
            console.log('Does this ever happen, no aggregate measures on a base query that has student click through?');
          }
          //resolve the click query filter:
          clickQuery.filter = angular.copy(baseQuery.filter);
          var exp = {};
          var clickValueField = baseQuery.aggregateMeasures[baseQuery.aggregateMeasures.length - 1];
          var measureOperand = {
            type: 'MEASURE',
            value: {
              measure: clickValueField.measure,
              field: clickValueField.aggregation
            }
          };
          if(clickValueField.buckets) {
            //create a range condition based on the click value
            //create an equality condition based on the click value
            exp = {
              type: 'EXPRESSION',
              leftHandSide: {
                type: 'EXPRESSION',
                leftHandSide: angular.copy(measureOperand),
                operator: 'GREATER_THAN_OR_EQUAL',
                rightHandSide: {
                  type: consts.placeholderValues['${clickValueMin}'],
                  value: '${clickValueMin}'
                }
              },
              operator: 'AND',
              rightHandSide: {
                type: 'EXPRESSION',
                leftHandSide: angular.copy(measureOperand),
                operator: 'LESS_THAN',
                rightHandSide: {
                  type: consts.placeholderValues['${clickValueMax}'],
                  value: '${clickValueMax}'
                }
              }
            };
          } else {
            exp = {
              type: 'EXPRESSION',
              leftHandSide: angular.copy(measureOperand),
              operator: 'EQUAL',
              rightHandSide: {
                type: consts.placeholderValues['${clickValue}'],
                value: '${clickValue}'
              }
            };
          }
          clickQuery.having = exp;
          return clickQuery;
        };

        /**
         * Given the UI specific model for a query, or query in progress (paramter qip), this method produces
         * a server side model for a query, or throws exceptions while trying.
         *
         * @param qip
         * @returns {{aggregateMeasures: Array, fields: Array, filter: null, subqueryColumnsByPosition: null}}
         */
        scope.produceQueryFromQueryInProgress = function(qip) {
          var aggregateMeasures = [];
          var fields = [];
          var typeToUse = null;
          var y = null;
          var newQuery = {
            aggregateMeasures: aggregateMeasures,
            fields: fields,
            filter: null,
            subqueryColumnsByPosition: null
          };
          var q = qip;
          //resolve the x-axis dimensions or measures
          if(q.x) {
            /* {
             aggregation: "COUNT",
             bucketAggregation: null,
             buckets: null,
             measure: "ATTENDANCE"
             }
             */
            var xField = {};
            var x = q.x;
            typeToUse = x.type;
            if(scope.measures.indexOf(x.table.toLowerCase()) !== -1) {
              typeToUse = 'MEASURE';
            } else {
              typeToUse = 'DIMENSION';
            }
            if(typeToUse === 'MEASURE') {
              if(consts.aggregations.indexOf(x.field) !== -1) {
                xField.aggregation = x.field;
              }
              xField.measure = x.table.toUpperCase();
              //xField.bucketAggregation = angular.copy(x.buckets);
              aggregateMeasures.push(xField);
            } else {
              //DIMENSION
              xField.dimension = x.table.toUpperCase();
              xField.bucketAggregation = x.bucketAggregation;
              xField.field = x.field;
              fields.push(xField);
            }
            xField.buckets = angular.copy(x.buckets);
            scope.setDefaultTypeOnBuckets(xField.buckets);
            //scope.setDefaultTypeOnBuckets(xField.bucketAggregation);
          }
          //replace the series dimension or measure
          if(q.series) {
            //field table type aggregation
            var s = q.series;
            var seriesField = {};
            if(s.type === 'MEASURE') {
              seriesField.aggregation = s.aggregation;
              seriesField.measure = s.table.toUpperCase();
              //seriesField.bucketAggregation = angular.copy(s.bucketAggregation);
              aggregateMeasures.push(seriesField);
            } else {
              //DIMENSIONS
              seriesField.dimension = s.table.toUpperCase();
              seriesField.field = s.field;
              fields.push(seriesField);
            }
            seriesField.buckets = angular.copy(s.buckets);
            scope.setDefaultTypeOnBuckets(seriesField.buckets);
          }
          //Resolve the yAxis dimensions or measures
          if(q.y) {
            var ys = q.y;
            for(var i = 0; i < ys.length; i++) {
              y = ys[i];
              var yField = {};
              typeToUse = y.type;
              if(scope.measures.indexOf(y.table.toLowerCase()) !== -1) {
                typeToUse = 'MEASURE';
              } else {
                typeToUse = 'DIMENSION';
              }
              if(typeToUse === 'MEASURE') {
                if(consts.aggregations.indexOf(y.field) !== -1) {
                  yField.aggregation = y.field;
                }
                yField.aggregation = y.aggregation;
                yField.measure = y.table.toUpperCase();
                aggregateMeasures.push(yField);
              } else {
                //TODO:If the y-axis is a dimension, it needs to have a COUNT aggregate function (at present)
                yField.dimension = y.table.toUpperCase();
                yField.field = y.field;
                if(!y.field || y.field === '*') {
                  yField.field = 'ID';
                }
                fields.push(yField);
              }
              //yField.bucketAggregation = y.bucketAggregation;
              yField.buckets = angular.copy(y.buckets);
              scope.setDefaultTypeOnBuckets(yField.buckets);
            }
          }
          //If the x-axis has no aggregate function and the Y axis field is a measure, there is no subquery
          //Otherwise, there is a subquery & superquery
          if((q.x.aggregation || consts.aggregations.indexOf(q.x.field) !== -1) ||
              (scope.measures.indexOf(q.y.field) == -1)) {
            //There is a subquery
            newQuery.subqueryColumnsByPosition = [];
            //Handle x-columns
            var xCol = {
              'position': 0,
              'function': q.x.aggregation
            };
            if( scope.measures.indexOf(q.x.table) !== -1 ) {
              //TODO: Should this be based on the number of measures from the y-cols?
              xCol.position = 1;
              if(q.x.buckets && q.x.buckets.bucketAggregation) {
                xCol.position++;
              }
            }
            newQuery.subqueryColumnsByPosition.push(xCol);
            //Handle series columns, if any
            var yPos = xCol.position + 1;
            //If the ypos field was a measure, the xpos must be the dimension
            if(xCol.position > 0) {
              yPos = 0;
            }
            if(q.series) {
              yPos++;
              var seriesCol = {
                'position': xCol.position + 1,
                'function': q.series.aggregation
              };
              newQuery.subqueryColumnsByPosition.push(seriesCol);
            }
            //Y axis columns
            if(q.y) {
              for(var e = 0; e < q.y.length; e++) {
                y = q.y[e];
                if(scope.measures.indexOf(y.table) === -1) {
                  yPos = yPos + e;
                }
                var func = y.aggregation;
                //At present all dimension y-axis fields are COUNT
                if(scope.measures.indexOf(y.table) === -1) {
                  func = 'COUNT';
                }
                var yCol = {
                  'position': yPos,
                  'function': func
                };
                newQuery.subqueryColumnsByPosition.push(yCol);
              }
            }
          }
          //Resolve the filter
          if(q.group) {
            // { operator: 'AND', rules: [ { condition:'', data:'', field:'' }, {...} ]}
            var g = q.group;
            newQuery.filter = scope.returnExpressionFromGroup(g);
          }
          return newQuery;
        };

        scope.returnExpressionFromGroup = function(g) {
          var operator = g.operator;
          var currExp = null;
          for(var f = 0; f < g.rules.length; f++) {
            var r = g.rules[f];
            var exp = {};
            if(r.condition && r.data && r.field) {
              //Build the expression!
              exp = {
                leftHandSide: scope.resolveLhs(r.field),
                operator: r.condition,
                rightHandSide: {
                  type: scope.resolveRhsType(r.data.value),
                  value: r.data.value
                },
                type: 'EXPRESSION'
              };
            } else {
              exp = scope.returnExpressionFromGroup(r.group);
            }
            if(!currExp) {
              currExp = {};
            }
            //Rebalance the tree if needed
            if(!currExp.leftHandSide) {
              currExp.leftHandSide = exp;
            } else {
              currExp.rightHandSide = exp;
              currExp.type = 'EXPRESSION';
              currExp.operator = operator;
              var newCurrExp = {
                leftHandSide: currExp,
                type: 'EXPRESSION',
                operator: operator
              };
              currExp = newCurrExp;
            }
          }
          if(currExp && !currExp.rightHandSide && currExp.leftHandSide) {
            currExp = currExp.leftHandSide;
          }
          return currExp;
        };

        scope.createNewReport = function() {
          scope.dashboardReports.unshift({
            sizeX: 6,
            row: 0,
            col:0,
            report: { name: 'New Report', chartQuery: {} }
          });
        };
        scope.deleteReport = function($event, rpt) {
          var idx = scope.dashboardReports.indexOf(rpt);
          scope.dashboardReports.splice(idx, 1);
        };

        scope.toast = function(msg) {
          $mdToast.show(
            $mdToast.simple()
              .content(msg)
              .action('OK')
              .hideDelay(2000)
          );
        };

        scope.saveDashboard = function() {
          var newDash = scope.produceUpdatedDashboard();
          if(newDash.id) {
            //update
            api.dashboard.put(
              { schoolId: newDash.schoolId, dashboardId: newDash.id },
              newDash,
              function(){
                scope.toast('Dashboard updated');
                scope.dashboard = newDash;
                scope.$parent.d.editDashboard = false;
              },
              function(){
                scope.toast('Update failed');
              });
          } else {
            //create
            api.dashboard.post(
              { schoolId: newDash.schoolId },
              newDash,
              function(success){
                scope.toast('Dashboard updated');
                newDash.id = success.id;
                scope.dashboard = newDash;
                scope.$parent.d.editDashboard = false;
              },
              function(){
                scope.toast('Update failed');
              });
          }
        };

        scope.cancelChanges = function() {
          scope.dashboardReports = scope.processDashboard();
          scope.$parent.d.editDashboard = false;
        };
        scope.processDashboard = function() {
          var gridsterData = [];
          if(scope.dashboard) {
            for (var m = 0; m < scope.dashboard.rows.length; m++) {
              var currRow = scope.dashboard.rows[m];
              for (var n = 0; n < currRow.reports.length; n++) {
                var currReport = angular.copy(currRow.reports[n]);
                var gElement = {
                  sizeX: 6 * 1 / currRow.reports.length,
                  //sizeY: 0.5,
                  row: m,
                  col: n * 6 * 1 / currRow.reports.length,
                  report: currReport
                };
                gridsterData.unshift(gElement);
              }
            }
          }
          return gridsterData;
        };
        scope.produceUpdatedDashboard = function() {
          var newDash = {
            schoolId: statebag.school.id,
            name: scope.dashboard.name,
            id: scope.dashboard.id,
            rows: []
          };
          var minPos, maxPos, currRow;
          if(scope.dashboardReports) {
            for(var i = 0; i < scope.dashboardReports.length; i++) {
              var gridEl = scope.dashboardReports[i];
              while(newDash.rows.length <= gridEl.row) {
                newDash.rows.push({ reports: [] });
              }
              if(currRow !== gridEl.row) {
                currRow = gridEl.row;
                minPos = gridEl.col;
                maxPos = gridEl.col;
              }
              var newRpt = angular.copy(gridEl.report);
              newRpt.type = newRpt.type.toUpperCase();
              if(gridEl.col > maxPos) {
                newDash.rows[gridEl.row].reports.push(newRpt);
                maxPos = gridEl.col;
              } else if(gridEl.col < minPos) {
                newDash.rows[gridEl.row].reports.unshift(newRpt);
                minPos = gridEl.col;
              } else {
                newDash.rows[gridEl.row].reports.unshift(newRpt);
                //If the position of the current element is in between the min and max,
                //swap it with the element to its right in the array
                if(newDash.rows[gridEl.row].reports.length > 1) {
                  var tmp = newDash.rows[gridEl.row].reports[1];
                  newDash.rows[gridEl.row].reports[1] = newRpt;
                  newDash.rows[gridEl.row].reports[0] = tmp;
                }
              }
            }
          }
          return newDash;
        };
      }
    };
  }]);
