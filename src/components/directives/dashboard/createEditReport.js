'use strict';
angular.module('teacherdashboard')
  .directive('createEditReport', [ '$window', 'api', 'dijkstra', function($window, api, dijkstra) {
    return {
      scope: {
        report: '=',
        queryComponents: '=',
        theme: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditReport.html',
      replace: true,
      link: function(scope){
        /**
         * Autocomplete related filters
         * @param query
         * @returns {Function}
         */
        var createFilterFor = function(query) {
          var lowercaseQuery = angular.lowercase(query);
          return function filterFn(vegetable) {
            return angular.lowercase(vegetable).indexOf(lowercaseQuery) !== -1;
          };
        }

        scope.querySearch = function(query) {
          var results = query ? scope.tableChoices.filter(createFilterFor(query)) : scope.tableChoices;
          return results;
        };

        /*
         *
         *   FUNCTIONS TO CONVERT QUERY FILTERS TO EXPRESSION BUILDER GROUPS
         *
         */
        var EXPR = 'EXPRESSION';
        scope.resolveGroupFieldObject = function(input) {
          if(input.dimension) {
            return { table: input.dimension, field: input.field };
          } else if (input.measure) {
            return { table: input.measure, field: input.field };
          }
        }
        scope.parseGroupFromExpression = function(exp) {
          scope.aggregations = ['COUNT', 'SUM', 'AVG', 'STD_DEV'];
          scope.aggs = [
            { aggregation: 'COUNT', label: 'number'},
            { aggregation: 'SUM', label: 'sum'},
            { aggregation: 'AVG', label: 'average'},
            { aggregation: 'STD_DEV', label: 'standard deviation'}

          ];
          var grp = {
            'operator': 'AND',
            'rules': []
          };
          if(!exp) {
            return grp
          }
          var op = exp.operator;
          if(op === 'OR') {
            grp.operator = op;
          }
          //ADD THE LHS RULES
          if(exp.leftHandSide.type === EXPR) {
            var lhsRules = scope.parseRuleFromExpression(exp.leftHandSide, op);
            grp.rules = grp.rules.concat(lhsRules);
            var rhsRules = scope.parseRuleFromExpression(exp.rightHandSide, op);
            grp.rules = grp.rules.concat(rhsRules);
          } else {
            grp.rules.push({
              'condition': exp.operator,
              'field': scope.resolveGroupFieldObject(exp.leftHandSide.value),
              'data': exp.rightHandSide
            });
          }
          return grp;
        };

        scope.parseRuleFromExpression = function(exp, currOp) {
          var rules = [];
          if(exp.operator !== currOp && (exp.operator === 'AND' || exp.operator === 'OR')) {
            rules.push( { group: scope.parseGroupFromExpression(exp) } );
          } else {
            //ADD THE LHS RULES
            if(exp.leftHandSide.type === EXPR) {
              var lhsRules = scope.parseRuleFromExpression(exp.leftHandSide, currOp);
              rules = rules.concat(lhsRules);
              var rhsRules = scope.parseRuleFromExpression(exp.rightHandSide, currOp);
              rules = rules.concat(rhsRules);
            } else {
              rules.push({
                'condition': exp.operator,
                'field': scope.resolveGroupFieldObject(exp.leftHandSide.value),
                'data': exp.rightHandSide
              });
            }
          }
          return rules;
        };

        scope.addRuleToGroup = function() {
          if(!scope.group.rules) {
            scope.group.rules = [];
          }
          scope.group.rules.push({
            'condition': null,
            'field': null,
            'data': null
          });
        };

        scope.group = scope.parseGroupFromExpression(scope.report.chartQuery.filter);


        /*
         *
         *   FUNCTIONS TO CONVERT QUERY MEASURE AND DIMENSIONS INTO  xData and yData
         *
         */
        scope.tableChoices = [];
        scope.dimensions = [];
        scope.dimensionFields = {};
        scope.measures = [];
        scope.measureFields = {};
        for(var j = 0; j < scope.queryComponents.availableDimensions.length; j++) {
          var dim = scope.queryComponents.availableDimensions[j];
          scope.dimensions.push(dim.type.toLowerCase());
          scope.dimensionFields[dim.type.toLowerCase()] = dim;
        }
        for(var j = 0; j < scope.queryComponents.availableMeasures.length; j++) {
          var meas = scope.queryComponents.availableMeasures[j];
          scope.measures.push(meas.measure.toLowerCase());
          scope.measureFields[meas.measure.toLowerCase()] = meas;
        }
        scope.tableChoices = angular.copy(scope.dimensions);
        for(var j = 0; j < scope.measures.length; j++) {
          if(scope.tableChoices.indexOf(scope.measures[j]) === -1) {
            scope.tableChoices.push(scope.measures[j]);
          }
        }
        scope.xOptions = scope.tableChoices;
        scope.yOptions = scope.tableChoices;
        scope.groupByOptions = ['Race', 'Ethnicity', 'ELL', 'SPED'];

        /**
         * Returns an object of the form:
         * {
         *    aggregation: 'AGGREGATE_FUNCTION',
         *    type: 'MEASURE|DIMENSION|NULL',
         *    table: 'TABLE_NAME',
         *    field: 'FIELD_NAME',
         *    buckets: []
         * }
         * @param position
         * @returns {Array}
         */
        var resolveFieldFromSubqueryPosition = function(position) {
          //First item: aggregate function second item: dimension/measure third: field
          var returnVals = {};
          var pos = position.position;
          var query = scope.report.chartQuery;
          returnVals.aggregation = position.function; //aggregate
          if(pos === -1) {
            returnVals.type = null; // type of field
            returnVals.table = query.fields[0].dimension; // table name
            returnVals.field = '*';  //field name
          } else if(query.fields && query.fields.length > pos) {
            var f = query.fields[pos - 1];
            returnVals.type = 'DIMENSION'; //type
            returnVals.table = f.dimension.toLowerCase(); //table name
            returnVals.field = f.field; //field name
          } else {
            var fieldsLength = query.fields.length;
            if(!fieldsLength) {
              fieldsLength = 0;
            }
            //TODO: subtract extra values for the bucket...
            var bucketNum = 0;
            for(var i = 0; i < query.aggregateMeasures.length; i++) {
              if(query.aggregateMeasures[i].buckets) {
                bucketNum++;
              }
            }
            var meas = query.aggregateMeasures[pos - fieldsLength - bucketNum];
            returnVals.type = 'MEASURE'; //type of field
            returnVals.table = meas.measure.toLowerCase(); //table name
            returnVals.field = meas.aggregation; //field name
            if(meas.buckets) {
              returnVals.buckets = meas.buckets;
            }
          }
          return returnVals;
        }

        scope.resolveTableFields = function(tableString) {
          var fields = [];
          var dimObj = scope.dimensionFields[tableString];
          if(dimObj) {
            fields = angular.copy(dimObj.fields);
          } else {
            var measObj = scope.measureFields[tableString];
            if(measObj) {
              fields = angular.copy(measObj.fields);
            }
          }
          fields.push('SUM');
          fields.push('COUNT');
          fields.push('AVG');
          return fields;
        }


        var query = scope.report.chartQuery;
        if(!query) {
          //no query, generate a valid default?
        }

        if(query.subqueryColumnsByPosition) {
          var yPos = 1;
          //If there are 3 subquery columns referenced, the second is the series
          if(query.subqueryColumnsByPosition.length > 2) {
            yPos = 2;
            scope.series = resolveFieldFromSubqueryPosition(query.subqueryColumnsByPosition[1]);
          }
          scope.xData = resolveFieldFromSubqueryPosition(query.subqueryColumnsByPosition[0]);
          scope.yData = [resolveFieldFromSubqueryPosition(query.subqueryColumnsByPosition[yPos])];
        } else if(!query.fields) {
          if (!query.aggregateMeasures) {
            //New or empty report
            scope.xData = null;
            //{
            //  aggregation: null,
            //  type: 'DIMENSION',
            //  table: 'student',
            //  field: 'Ethnicity',
            //  buckets: null
            //};
            scope.yData = [ {}
              //{
              //  aggregation: 'SUM',
              //  type: 'MEASURE',
              //  table: 'course_grade',
              //  field: null,
              //  buckets: null
              //}
            ];
          } else {
            var aggMeas = query.aggregateMeasures[0];
            //figure out the y and y column values when there are no dimensions suggested (y column is aggregate function), x is the field value with any buckets
            scope.xData = {
              aggregation: aggMeas.bucketAggregation,
              type: 'MEASURE',
              table: aggMeas.measure.toLowerCase(),
              field: aggMeas.bucketAggregation,
              buckets: aggMeas.buckets
            }
            scope.yData = [{
              aggregation: aggMeas.aggregation,
              type: 'MEASURE',
              table: aggMeas.measure.toLowerCase(),
              field: null
            }];
          }
        } else {
          //x axis is the query.fields[0]
          scope.xData = {
            aggregation: query.fields[0].bucketAggregation,
            type: 'DIMENSION',
            table: query.fields[0].dimension.toLowerCase(),
            field: query.fields[0].field
          };
          //Series exists if there is a fields[1]
          if(query.fields.length > 1) {
            scope.series = {
              aggregation: null,
              type: 'DIMENSION',
              table: query.fields[1].dimension.toLowerCase(),
              field: query.fields[1].field
            };
          }
          //Yaxis field(s) are the aggregate measures.
          scope.yData = [];
          for(var i = 0; i < query.aggregateMeasures.length; i++) {
            scope.yData.push({
              aggregation: query.aggregateMeasures[i].aggregation,
              type: 'MEASURE',
              table: query.aggregateMeasures[i].measure.toLowerCase(),
              field: null
            });
          }
        }

        //Given the currently selected X and Y axis values, generate the complete set of eligible filter fields
        var generateTableGraph = function() {
          var g = new dijkstra.Graph();
          for (var j = 0; j < scope.queryComponents.availableDimensions.length; j++) {
            var dim = scope.queryComponents.availableDimensions[j];
            var edges = {};
            if (dim.parentDimensions) {
              for (var k = 0; k < dim.parentDimensions.length; k++) {
                edges[dim.parentDimensions[k]] = 1;
              }
            }
            g.addVertex(dim.type, edges);
          }
          for (var j = 0; j < scope.queryComponents.availableMeasures.length; j++) {
            var meas = scope.queryComponents.availableMeasures[j];
            var edges = {};
            if (meas.compatibleDimensions) {
              for (var k = 0; k < meas.compatibleDimensions.length; k++) {
                edges[meas.compatibleDimensions[k]] = 1;
              }
              for (var k = 0; k < meas.compatibleDimensions.length; k++) {
                edges[meas.compatibleMeasures[k]] = 1;
              }
            }
            g.addVertex(meas.measure, edges);
          }
          return g;
        }

        var resolveParents = function(table, parents) {
          if(!scope.g) {
            scope.g = generateTableGraph();
          }
          if(!parents) {
            parents = [];
          }
          var edges = scope.g.getVertex(table);
          if(edges) {
            angular.forEach(edges, function(value, key) {
              if(key && key !== 'undefined' && parents.indexOf(key) === -1) {
                parents.push(key);
                var grandParents = resolveParents(key, parents);
                angular.forEach(grandParents, function (v) {
                  if (v && v !== 'undefined' && parents.indexOf(v) === -1) {
                    parents.push(v);
                  }
                });
              }
            });
          }
          return parents;
        }

        var resolveShortestPath = function(start, end) {
          if(!scope.g) {
            scope.g = generateTableGraph();
          }
          return scope.g.
            shortestPath(start.toUpperCase(), end.toUpperCase()).
            concat([start.toUpperCase()]).
            reverse();
        }

        var setScopeFilterFieldsAndTables = function() {
          var dims = [];
          var parentDims = [];
          if(scope.xData && scope.yData && scope.yData.length > 0) {
            dims = resolveShortestPath(scope.xData.table, scope.yData[0].table);
            if(!dims || dims.length < 2) {
              dims = resolveShortestPath(scope.yData[0].table, scope.xData.table);
            }
            parentDims = resolveParents(scope.xData.table.toUpperCase());
            parentDims = parentDims.concat(resolveParents(scope.yData[0].table.toUpperCase()));
          } else if(scope.xData) {
            dims = [ angular.copy(scope.xData)];
            parentDims = resolveParents(scope.xData.table.toUpperCase());
          } else if(scope.yData && scope.yData[0].table) {
            dims = [ angular.copy(scope.yData[0]) ];
            parentDims = resolveParents(scope.yData[0].table.toUpperCase());
          }
          angular.forEach(parentDims, function(value) {
            if(value && value !== 'undefined' && dims.indexOf(value) === -1) {
              dims.push(value);
            }
          });
          var tablesToFields = {};
          for(var i = 0; i < dims.length; i++) {
            var dimObj = scope.dimensionFields[dims[i].toLowerCase()];
            if(dimObj) {
              if(dimObj.fields) {
                tablesToFields[dimObj.type] = dimObj.fields;
              }
            } else {
              var measureObj = scope.measureFields[dims[i].toLowerCase()];
              if(measureObj) {
                if(measureObj.fields) {
                  tablesToFields[measureObj.measure] = measureObj.fields;
                }
              }
            }
          }
          //return dimFields;
          scope.filterableTables = dims;
          scope.filterableFields = tablesToFields;
          return tablesToFields;
        }

        setScopeFilterFieldsAndTables();
        scope.$watch('xData', function(newValue, oldValue) {
          if(newValue && newValue !== oldValue) {
            setScopeFilterFieldsAndTables();
          }
        });

        scope.$watch('yData', function(newValue, oldValue) {
          if(newValue && newValue !== oldValue) {
            setScopeFilterFieldsAndTables();
          }
        });

        /*
         *
         * CRUD METHODS CALLED IN THE TEMPLATE HTML
         *
         */
        scope.addBucket = function() {
          if(!scope.xData.buckets) {
            scope.xData.buckets = [];
          }
          scope.xData.buckets.push({ start: null, end: null, label: null });
        };

        scope.removeBucket = function(bucket) {
          var index = scope.xData.buckets.indexOf(bucket);
          if(-1 !== index) {
            scope.xData.buckets.splice(index, 1);
          }
        }

        scope.setReportType = function(typ) {
          if(typ === 'BAR' || typ === 'SPLINE' || typ === 'PIE' || typ === 'SCATTERPLOT') {
            scope.report.type = typ;
          }
        }

        scope.addXAggregation = function(xData) {
          xData.aggregation = 'SUM';
        }
      }
    };
  }]);
