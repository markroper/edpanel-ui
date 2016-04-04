'use strict';
angular.module('teacherdashboard')
  .directive('goalsgrid', ['$state', 'statebag', 'api','$compile','$timeout','$document',
    function($state, statebag, api,$compile,$timeout,$document) {
      return {
        scope: {
          pgoals: '=',
          agoals: '=',
          completeGoals: '=',
          sections: '=',
          isAdvisorView: '=',
          goalsPromise: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/goalsgrid/goalsgrid.html',
        replace: true,
        link: function ($scope) {
          var resolveColor = function(goal) {
            if (goal.goalProgress === 'MET') {
              return '#4CAF50';
            }
            else {
              return '#F44336';
            }
          };

          $scope.today = new Date();
          $scope.lastyear = new Date();
          //Show up to three months ago
          $scope.lastyear.setFullYear($scope.today.getFullYear(),$scope.today.getMonth()-3);
          var body = $document.find('#completed');
          var template = '<div class="chart" ' +
            'time-frames-non-working-mode="hidden" ' +
            'gantt data="ganttInfo" ' +
            'headers="[\'month\']" ' +
            'allow-side-resizing="false"' +
            'from-date="lastyear">' +
            '<gantt-table></gantt-table>' +
            '<gantt-groups></gantt-groups></div>';

          $scope.goalsPromise.then(function(value) {
            $scope.ganttInfo = [];
            $scope.dates = ['month'];
            var nameMap = {};
            for (var i= 0; i < $scope.completeGoals.length; i++) {
              if (typeof nameMap[$scope.completeGoals[i].student.name] === 'undefined') {
                nameMap[$scope.completeGoals[i].student.name] = [];
              }
              nameMap[$scope.completeGoals[i].student.name].push($scope.completeGoals[i]);
            }

            for (var key in nameMap) {
              for (var i = 0; i < nameMap[key].length; i++) {
                $scope.ganttInfo.push(
                  {
                    name: nameMap[key][i].student.name + ': ' + nameMap[key][i].name, tasks: [ {
                    name: nameMap[key][i].student.name + ': ' + nameMap[key][i].name,
                    from: nameMap[key][i].startDate,
                    to: nameMap[key][i].endDate,
                    color: resolveColor(nameMap[key][i]),
                    goal: nameMap[key][i],
                    content: '<div></div>'
                  } ]
                  }

                );
              }
            }

            body.append($compile(template)($scope));
          });

          //THIS SHOULD STAY SO WHEN WE CAHGNE THIS I DON'T FORGET TEH RANDOM DATA FORMAT NECESSARY FOR TREES
          //for (var key in nameMap) {
          //  var nameList = [];
          //  var objectList = [];
          //  for (var i = 0; i < nameMap[key].length; i++) {
          //    nameList.push(nameMap[key][i].name);
          //    objectList.push(
          //      {
          //        name: nameMap[key][i].name, tasks: [ {
          //        name: nameMap[key][i].name,
          //        from: nameMap[key][i].startDate,
          //        to: nameMap[key][i].endDate,
          //        color: resolveColor(nameMap[key][i]),
          //        goal: nameMap[key][i],
          //        content: '<div></div>'
          //      } ]
          //      }
          //
          //    );
          //    console.log(nameList);
          //    console.log(objectList);
          //  }
          //  $scope.dada.push(
          //    {
          //      name: key,
          //      children: nameList
          //    }
          //  )
          //  $scope.dada = $scope.dada.concat(objectList);
          //}
        }
      };
    }]);
