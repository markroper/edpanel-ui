'use strict';
angular.module('teacherdashboard')
  .directive('surveyAggregate', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication',
    function($window, api, $rootScope, $state, $mdToast, authentication) {
      return {
        scope: {
          aggregateSurvey: '=',
          surveyAggregates: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/survey/surveyAggregate.html',
        replace: true,
        link: function($scope) {
          $scope.dismissAggregateResults = function() {
            $scope.aggregateSurvey = null;
            $scope.surveyAggregates = null;
          };
          /*
           {
            "surveyId":14,
            "respondents":2,
            "questions":[
              {"respondents":2,"question":{"type":"MULTIPLE_CHOICE","question":"mult choice","responseRequired":true,"type":"MULTIPLE_CHOICE","choices":["choice 1","choice 2","choice 3"]},"results":[0,2,0]},
              {"respondents":2,"question":{"type":"OPEN_RESPONSE","question":"open q","responseRequired":false,"type":"OPEN_RESPONSE"},"results":[]},
              {"respondents":2,"question":{"type":"TRUE_FALSE","question":"boolean question","responseRequired":true,"type":"TRUE_FALSE"},"results":[2,0]}]}
           */

        }
      }
    }]);
