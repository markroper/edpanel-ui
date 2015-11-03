'use strict';
angular.module('teacherdashboard')
  .directive('chorocalendar', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        calendarDataPromise: '=',
        slideClosed: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/chorocalendar/chorocalendar.html',
      replace: true,
      controller: 'ChoroplethCtrl',
      controllerAs: 'ctrl',
      link: function(scope, elem){
        var d3 = $window.d3;
        var width = 4000,
            height = 290,
            cellSize = 40; // cell size
        var CHORO_CONTAINER_SELECTOR = '.choropleth-container';

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

        // var color = d3.scale.quantize()
        //     .domain([-0.05, 0.05])
        //     .range(d3.range(11).map(function(d) { return 'q' + d + '-11'; }));

        var svg = d3.select(elem.find(CHORO_CONTAINER_SELECTOR)[0]).selectAll('svg')
            .data(d3.range(2015, 2016))
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

        //Scroll the calendar view to the latest month
        var svgWidth = elem.find('svg').width();
        elem.find(CHORO_CONTAINER_SELECTOR).scrollLeft(svgWidth);

        scope.calendarDataPromise.then(function(resolvedData) {
          var behaviorByDate = {};
          resolvedData.forEach(function(behavior){
            var currDate = moment(behavior.behaviorDate);
            var dateString = currDate.format('YYYY-MM-DD');
            if(!behaviorByDate[dateString]) {
              behaviorByDate[dateString] = [behavior];
            } else {
              behaviorByDate[dateString].push(behavior);
            }
          });
          rect.attr('class', function(d) { 
            var weekday = moment(d).weekday();
            var colorVal = '11';
            //Only evaluate wekdays
            if(weekday !== 0 && weekday !== 6) {

              if(behaviorByDate[d]) {
                var size = behaviorByDate[d].length;
                if(size === 1) {
                  //One behavior event is orange
                  colorVal = '3';
                } else {
                  //multiple behavior events in one day is red
                  colorVal = '1';
                }
              } else {
                //If there were no behavior events, thats green!
                colorVal = '8';
              }
            }
            return 'day q' + colorVal + '-11';
          })
          .select('title')
            .text(function(d) { return d + ': ' + percent(resolvedData[d]); });
        });
      }
    };
  }])
  .controller('ChoroplethCtrl', function($scope) {
    $scope.name = 'behavior';
  });