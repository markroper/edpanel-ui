'use strict';
angular.module('teacherdashboard')
  .directive('chorocalendar', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        calendarDataPromise: '=',
        greenToYellow: '@',
        yellowToRed: '@',
        slideClosed: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/chorocalendar/chorocalendar.html',
      replace: true,
      controller: 'ChoroplethCtrl',
      controllerAs: 'ctrl',
      link: function(scope, elem){
        if(!scope.greenToYellow) {
          scope.greenToYellow = 1;
        }
        if(!scope.yellowToRed) {
          scope.yellowToRed = 3;
        }
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
            format = d3.time.format('%Y-%m-%d');

        var currentDate = $window.moment();
        var lastYearToday = $window.moment().subtract(1, 'years');
        var currentYear = currentDate.year();

        var svg = d3.select(elem.find(CHORO_CONTAINER_SELECTOR)[0]).selectAll('svg')
            .data(d3.range(currentYear - 1, currentYear))
          .enter().append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'RdYlGn')
          .append('g');

        var rect = svg.selectAll('.day')
            .data(function() {
              return d3.time.days(lastYearToday.toDate(), currentDate.toDate());
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
              .data(function() {
                return d3.time.months(lastYearToday.toDate(), currentDate.toDate());
              })
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
            var currDate = $window.moment(behavior.behaviorDate);
            var dateString = currDate.format('YYYY-MM-DD');
            if(!behaviorByDate[dateString]) {
              behaviorByDate[dateString] = [behavior];
            } else {
              behaviorByDate[dateString].push(behavior);
            }
          });

          rect.attr('demerits', function(d){
            if(behaviorByDate[d] && behaviorByDate[d].length > 0) {
              return behaviorByDate[d].length;
            }
            return 0;
          });
          rect.attr('class', function(d) {
            var weekday = $window.moment(d).weekday();
            var colorVal = '11';
            //Only evaluate wekdays
            if(weekday !== 0 && weekday !== 6) {
              if(behaviorByDate[d]) {
                var size = behaviorByDate[d].length;
                if(size >= scope.yellowToRed){
                  //multiple behavior events in one day is red
                  colorVal = '1';
                } else if(size >= scope.greenToYellow) {
                  //One behavior event is orange
                  colorVal = '3';
                } else {
                  colorVal = '8';
                }
              } else {
                //If there were no behavior events, thats green!
                colorVal = '8';
              }
            }
            return 'day q' + colorVal + '-11';
          }).select('title')
            .text(function(d) { return behaviorByDate[d] + ' demerits'; });

          var div = d3.select('body').append('div')
            .attr('class', 'choro-tooltip')
            .style('display', 'none');

          function mouseover() {
            if(this.attributes.demerits.value !== 0) {
              div.style('display', 'inline');
              div.text(this.attributes.demerits.value + ' demerit(s)');
            }
          }
          function mousemove() {
            div.style('left', (d3.event.pageX - 34) + 'px')
              .style('top', (d3.event.pageY - 12) + 'px');
          }
          function mouseout() {
            div.style('display', 'none');
          }
          rect.on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        });
      }
    };
  }])
  .controller('ChoroplethCtrl', function($scope) {
    $scope.name = 'behavior';
  });
