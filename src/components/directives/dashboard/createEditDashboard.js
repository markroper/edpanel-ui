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
          //If the x-axis has no aggregate function, there is no subquery
          if(q.x.aggregation || consts.aggregations.indexOf(q.x.field) !== -1) {
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
                  yPos = 0 + e;
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
            var operator = g.operator;
            var r = null;
            if(g.rules.length === 1) {
              r = g.rules[0];
              newQuery.filter = {
                leftHandSide: scope.resolveLhs(r.field),
                operator: r.condition,
                rightHandSide: {
                  type: scope.resolveRhsType(r.data.value),
                  value: r.data.value
                },
                type: 'EXPRESSION'
              };
            } else {
              var currExp = {};
              for(var f = 0; f < g.rules.length; f++) {
                r = g.rules[f];
                if(r.condition && r.data && r.field) {
                  //Build the expression!
                  var exp = {
                    leftHandSide: scope.resolveLhs(r.field),
                    operator: r.condition,
                    rightHandSide: {
                      type: scope.resolveRhsType(r.data.value),
                      value: r.data.value
                    },
                    type: 'EXPRESSION'
                  };
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
                      operator: g.op
                    };
                    currExp = newCurrExp;
                  }
                }
              }
              if(currExp.leftHandSide && currExp.rightHandSide && currExp.operator && currExp.type) {
                newQuery.filter = currExp;
              }
            }
          }
          return newQuery;
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
          if(scope.dashboardReports) {
            for(var i = 0; i < scope.dashboardReports.length; i++) {
              var gridEl = scope.dashboardReports[i];
              while(newDash.rows.length <= gridEl.row) {
                newDash.rows.push({ reports: [] });
              }
              var newRpt = angular.copy(gridEl.report);
              newRpt.type = newRpt.type.toUpperCase();
              newDash.rows[gridEl.row].reports.unshift(newRpt);
            }
          }
          return newDash;
        };
      }
    };
  }]);
