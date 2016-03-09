'use strict';
angular.module('teacherdashboard')
  .directive('createEditReport', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        report: '=',
        queryComponents: ''
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditReport.html',
      replace: true,
      link: function(scope){
        scope.xOptions = [ 'assignment date', 'GPA', 'Referrals', 'Failing classes' ];
        scope.yOptions = [ 'Count of Students', 'SUM referrals'];
        scope.groupByOptions = ['Race', 'Ethnicity', 'ELL', 'SPED'];
        var EXPR = 'EXPRESSION';
        scope.parseGroupFromExpression = function(exp) {
          var grp = {
            'operator': 'AND',
            'rules': []
          };
          if(!exp) {
            return grp
          }
          var op = exp.operator;
          grp.operator = op;
          //ADD THE LHS RULES
          if(exp.leftHandSide.type === EXPR) {
            var lhsRules = scope.parseRuleFromExpression(exp.leftHandSide, op);
            grp.rules = grp.rules.concat(lhsRules);
            var rhsRules = scope.parseRuleFromExpression(exp.rightHandSide, op);
            grp.rules = grp.rules.concat(rhsRules);
          } else {
            grp.rules.push({
              'condition': exp.operator,
              'field': exp.leftHandSide,
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
                'field': exp.leftHandSide,
                'data': exp.rightHandSide
              });
            }
          }
          return rules;
        };
        scope.group = scope.parseGroupFromExpression(scope.report.chartQuery.filter);

        scope.addBuckets = function() {
          //TODO:implement
        }

        scope.setReportType = function(typ) {
          if(typ === 'BAR' || typ === 'SPLINE' || typ === 'PIE' || typ === 'SCATTERPLOT') {
            scope.report.type = typ;
          }
        }
      }
    };
  }]);
