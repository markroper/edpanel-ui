'use strict';
angular.module('teacherdashboard')
  .directive('scatterplot', [ '$window', '$compile', '$sanitize','statebag', 'api', function($window, $compile, $sanitize, statebag, api) {
    return {
      scope: {
        chartDataPromise: '=',
        chartTitle: '@'
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/scatterplot/scatterplot.html',
      replace: true,
      controllerAs: 'ctrl',
      link: function(scope, elem){
        var d3 = $window.d3;
        var rawSvg = elem.find('svg')[0];
        var margin = {top: 20, right: 20, bottom: 30, left: 40};
        var width = elem.find('.svg-container').width() - margin.left - margin.right;
        var height = 350 - margin.top - margin.bottom;
        var x = d3.time.scale()
            .range([0, width]);
        var y = d3.scale.linear()
            .range([height, 0]);
        var categories = {};
        var sects = [];

        var parseDate = d3.time.format('%x').parse;

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .ticks(width/300);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left').ticks(2);

        var svg = d3.select(rawSvg)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


        scope.chartDataPromise.then(function(theData){
          var data = theData;
          data.forEach(function(d) {
            categories[d.category] = true;
          });
          for (var property in categories) {
              if (categories.hasOwnProperty(property)) {
                  sects.push(property);
              }
          }
          x.domain(d3.extent(data, function(d) { return d.dueDate; })).nice();
          y.domain(d3.extent(data, function(d) { return d.grade; })).nice();

          svg.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis)
            .append('text')
              .attr('x', width)
              .attr('y', -6)
              .style('text-anchor', 'end')
              .text('Due date');

          svg.append('g')
              .attr('class', 'y axis')
              .call(yAxis)
            .append('text')
              .attr('transform', 'rotate(-90)')
              .attr('y', 6)
              .attr('dy', '.71em')
              .style('text-anchor', 'end')
              .text('Grade');

          svg.selectAll('.dot')
              .data(data)
            .enter().append('circle')
              .attr('class', function(d){ return 'dot ' + d.category; })
              .attr('tooltip-append-to-body', true)
              .attr('tooltip-html-unsafe', function(d){
                return $sanitize('<strong>Teacher:</strong><span> ' + 
                  d.teacher + '</span><br/><strong>Grade:</strong><span> ' + 
                  d.grade + '%</span><br/><strong>Type:</strong><span> ' +
                  d.category + '</span>');
              })
              .attr('r', 6)
              .attr('cx', function(d) { return x(d.dueDate); })
              .attr('cy', function(d) { return y(d.grade); });

          var legend = svg.selectAll('.legend')
              .data(sects)
            .enter().append('g')
              .attr('class', 'legend')
              .attr('transform', function(d, i) { return 'translate(0,' + i * 40 + ')'; });

          legend.append('rect')
              .attr('x', width - 25)
              .attr('width', 40)
              .attr('height', 28)
              .attr('rx', 10)
              .attr('ry', 10)
              .attr('class', function(d){ return d; })
              .on('click', function(d){ 
                elem.toggleClass('Disable' + d);
                console.log(d);
              });

          legend.append('text')
              .attr('x', width - 35)
              .attr('y', 15)
              .attr('dy', '.35em')
              .style('text-anchor', 'end')
              .text(function(d) { return d; });
          $compile(elem)(scope);
        });
      }
    };
  }]);