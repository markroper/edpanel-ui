'use strict';
angular.module('teacherdashboard')
  .directive('studentsection', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        section: '=',
        assignmentDataPromise: '=',
        sectionGradePromise: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/studentsection/studentsection.html',
      replace: true,
      link: function(scope, elem) {
        scope.sectionGrade = {
          currentGrade: "B+",
          components: [
            { type: "Homework", grade: "B+" },
            { type: "Quizes", grade: "A+" },
            { type: "Tests", grade: "C+" },
            { type: "Final", grade: "B" }
          ]
        };

        scope.myData = scope.sectionGrade.components;
      }
    };
  }]);