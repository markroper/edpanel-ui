'use strict';
angular.module('teacherdashboard')
  .service('dijkstra', function() {
    /**
     * Basic priority queue implementation. If a better priority queue is wanted/needed,
     * this code works with the implementation in google's closure library (https://code.google.com/p/closure-library/).
     * Use goog.require('goog.structs.PriorityQueue'); and new goog.structs.PriorityQueue()
     */
    var PriorityQueue  = function() {
      this._nodes = [];

      this.enqueue = function (priority, key) {
        this._nodes.push({key: key, priority: priority });
        this.sort();
      };
      this.dequeue = function () {
        return this._nodes.shift().key;
      };
      this.sort = function () {
        this._nodes.sort(function (a, b) {
          return a.priority - b.priority;
        });
      };
      this.isEmpty = function () {
        return !this._nodes.length;
      };
    };

    return {
      /**
       * Pathfinding starts here
       */
       Graph: function(){
          var INFINITY = 1/0;
          this.vertices = {};

          this.addVertex = function(name, edges){
            this.vertices[name] = edges;
          };

          this.getVertex = function(name) {
            return this.vertices[name];
          };

          this.shortestPath = function (start, finish) {
            var nodes = new PriorityQueue(),
              distances = {},
              previous = {},
              path = [],
              smallest, vertex, neighbor, alt;

            for(vertex in this.vertices) {
              if(vertex === start) {
                distances[vertex] = 0;
                nodes.enqueue(0, vertex);
              }
              else {
                distances[vertex] = INFINITY;
                nodes.enqueue(INFINITY, vertex);
              }

              previous[vertex] = null;
            }

            while(!nodes.isEmpty()) {
              smallest = nodes.dequeue();

              if(smallest === finish) {
                path;

                while(previous[smallest]) {
                  path.push(smallest);
                  smallest = previous[smallest];
                }

                break;
              }

              if(!smallest || distances[smallest] === INFINITY){
                continue;
              }

              for(neighbor in this.vertices[smallest]) {
                alt = distances[smallest] + this.vertices[smallest][neighbor];

                if(alt < distances[neighbor]) {
                  distances[neighbor] = alt;
                  previous[neighbor] = smallest;

                  nodes.enqueue(alt, neighbor);
                }
              }
            }
            return path;
          };
        }
    };
  });
