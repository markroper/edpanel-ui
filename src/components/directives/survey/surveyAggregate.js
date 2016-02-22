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
          $scope.surveyAggregates.questions.forEach(function(q){
            if(q.question.type === 'MULTIPLE_CHOICE' || q.question.type === 'TRUE_FALSE') {
              var results = q.results;
              if (q.question.type === 'MULTIPLE_CHOICE') {
                var choices = q.question.choices;
                choices.unshift('choices');
                results.unshift('responses');
                $scope.newData = [results, choices];
              } else if (q.question.type === 'TRUE_FALSE') {
                results.unshift('responses');
                $scope.newData = [ results, ['choices', 'true', 'false']];
              }
            }
          });
        }
      };
    }]);
