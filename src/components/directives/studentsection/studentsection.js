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
      }
    };
  }]);