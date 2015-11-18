'use strict';
angular.module('teacherdashboard')
  .directive('scatterplot', [ '$window', '$compile', '$sanitize','statebag', 'api', function($window, $compile, $sanitize, statebag, api) {
    return {
      scope: {
        chartDataPromise: '=',
        section: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/scatterplot/scatterplot.html',
      replace: true,
      controllerAs: 'ctrl',
      link: function(scope, elem){
        var start = new Date().getTime();
        scope.tableConfig = {
          data: 'assignments',
          enableColumnMenus: false,
          columnDefs: [
            { field: 'date', type: 'date', cellFilter: 'date:\'yyyy-MM-dd\'' },
            { field: 'category' },
            { field: 'grade' },
            { field: 'teacher' },
            { field: 'comment' }
          ]
        };
        var tableViewHtml = 
          '<div class="table-view-container" flex="100" ng-if="assignmentView==\'table\'">' +
          '<div ui-grid="tableConfig" class=""></div></div>';
        var $assignmentsContainer = angular.element(elem).find('.assignment-scores');
        var $graphContainer = angular.element(elem).find('.svg-container');
        var $tableContainer;

        scope.assignmentView = 'graph';

        scope.injectTableView = function() {
          if(!$tableContainer) {
            $tableContainer = $compile(tableViewHtml)(scope);
            $graphContainer.after($tableContainer);
          }
        }
        var processRawAssignments = function(inputData) {
          var processedAssignments = [];
          inputData.forEach(function(d){
            if(d.assignment) {
              var p = {};
              //Resolve grade
              if(typeof d.awardedPoints !== 'undefined') {
                p.grade = Math.round(d.awardedPoints / d.assignment.availablePoints * 100);
              } else {
                if(d.completed) {
                  p.grade = 100;
                } else {
                  p.grade = 0;
                }
              }
              //Due date
              p.date = new Date(d.assignment.dueDate);
              
              //Section name
              p.category = d.assignment.type.toLowerCase();
              if(d.assignment.userDefinedType) {
                p.category = d.assignment.userDefinedType.toLowerCase();
              }
              //Teacher name
              p.teacher = "";
              if(scope.section.teachers[0]) {
                p.teacher = scope.section.teachers[0].name;
              }
              p.name = d.assignment.name;
              p.comment = d.comment;
              processedAssignments.push(p);
            }
          });
          return processedAssignments;
        }
        var categories = {};
        var sects = [];
        scope.chartDataPromise.then(function(theData){
          var data = processRawAssignments(theData);
          var end = new Date().getTime();
          var time = end - start;
          console.log('scatterplot data transform took: ' + time);
          scope.assignments = data;
          var exs = {};
          var categories = [];
          var categorizedData = {};
          var chartData = [];
          var WEEKSCORE = 'grade';
          exs[WEEKSCORE] = WEEKSCORE + '_x';
          categorizedData.weekscore = [[WEEKSCORE], [WEEKSCORE + '_x']];
          scope.section.gradeProgression.forEach(function(d){
            categorizedData.weekscore[0].push(Math.round(d.score * 100));
            categorizedData.weekscore[1].push(new Date(d.weekEnding));
          });
          data.forEach(function(d) {
            if(!exs[d.category]) {
              categories.push(d.category);
              exs[d.category] = d.category + '_x';
              categorizedData[d.category] = [
                [ d.category, d.grade ],
                [ d.category + '_x', d.date ]
              ];
            }
            categorizedData[d.category][0].push(d.grade);
            categorizedData[d.category][1].push(d.date);
          });
          angular.forEach(categorizedData, function(value, key){
              chartData.push(value[0]);
              chartData.push(value[1]);
          });
          var chart = $window.c3.generate({
            bindto: elem.find('.svg-container')[0],
            point: {
              r: 5
            },
            data: {
              columns: chartData,
              xs: exs,
              type: 'scatter',
              types: { 
                grade: 'line'
              }
            },
            grid: {
              x: {
                lines: [
                  { value: new Date(), text: 'today' }
                ]
              }
            },
            axis: {
              x: {
                type: 'timeseries'
              }
            }
          });
          chart.hide(categories);
        });
      }
    };
  }]);