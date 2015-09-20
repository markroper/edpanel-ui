'use strict';
angular.module('teacherdashboard')
  .directive('chorocalendar', [ '$window', function($window) {
    return {
      scope: {
        calendarDataPromise: '='
      },
      restrict: 'E',
      templateUrl: '/components/directives/chorocalendar/chorocalendar.html',
      replace: true,
      controller: 'ChoroplethCtrl',
      controllerAs: 'ctrl',
      link: function(scope, elem){
        var d3 = $window.d3;
        var width = 4000,
            height = 290,
            cellSize = 40; // cell size

        function monthTitle (t0) {
          return t0.toLocaleString('en-us', { month: 'long' }) + ', ' + t0.toString().split(' ')[3];
        }
        var noMonthsInARow = Math.floor(width / (cellSize * 7 + 50));
        var shiftUp = cellSize * 6.5;

        var day = d3.time.format('%w'), // day of the week
            //dayOfMonth = d3.time.format('%e'), // day of the month
            //dayOfYear = d3.time.format('%j'),
            week = d3.time.format('%U'), // week number of the year
            month = d3.time.format('%m'), // month number
            year = d3.time.format('%Y'),
            percent = d3.format('.1%'),
            format = d3.time.format('%Y-%m-%d');

        var color = d3.scale.quantize()
            .domain([-0.05, 0.05])
            .range(d3.range(11).map(function(d) { return 'q' + d + '-11'; }));

        var svg = d3.select(elem.find('.choropleth-container')[0]).selectAll('svg')
            .data(d3.range(2008, 2009))
          .enter().append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'RdYlGn')
          .append('g');

        var rect = svg.selectAll('.day')
            .data(function(d) { 
              return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
          .enter().append('rect')
            .attr('class', 'day')
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('x', function(d) {
              var monthPadding = 1.2 * cellSize*7 * ((month(d)-1) % (noMonthsInARow));
              return day(d) * cellSize + monthPadding; 
            })
            .attr('y', function(d) { 
              var weekDiff = week(d) - week(new Date(year(d), month(d)-1, 1) );
              var rowLevel = Math.ceil(month(d) / (noMonthsInARow));
              return (weekDiff*cellSize) + rowLevel*cellSize*8 - cellSize/2 - shiftUp;
            })
            .datum(format);

        svg.selectAll('.month-title')  // Jan, Feb, Mar and the whatnot
              .data(function(d) { 
                return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
            .enter().append('text')
              .text(monthTitle)
              .attr('x', function(d) {
                var monthPadding = 1.2 * cellSize*7* ((month(d)-1) % (noMonthsInARow));
                return monthPadding;
              })
              .attr('y', function(d) {
                var weekDiff = week(d) - week(new Date(year(d), month(d)-1, 1) );
                var rowLevel = Math.ceil(month(d) / (noMonthsInARow));
                return (weekDiff*cellSize) + rowLevel*cellSize*8 - cellSize - shiftUp;
              })
              .attr('class', 'month-title')
              .attr('d', monthTitle);

        scope.calendarDataPromise.then(function(resolvedData){
          var data = d3.nest()
            .key(function(d) { return d.Date; })
            .rollup(function(d) { return (d[0].Close - d[0].Open) / d[0].Open; })
            .map(resolvedData);

          rect.filter(function(d) { return d in data; })
              .attr('class', function(d) { return 'day ' + color(data[d]); })
            .select('title')
              .text(function(d) { return d + ': ' + percent(data[d]); });
        });
      }
    };
  }])
  .controller('ChoroplethCtrl', function($scope) {
    $scope.name = 'behavior';
  });