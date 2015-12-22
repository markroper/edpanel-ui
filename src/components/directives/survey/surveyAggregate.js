'use strict';
angular.module('teacherdashboard')
  .directive('surveyAggregate', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication', '$q', '$compile',
    function($window, api, $rootScope, $state, $mdToast, authentication, $q, $compile) {
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
              var d = $q.defer();
              q.chartDataPromise = d.promise;
              if (q.question.type === 'MULTIPLE_CHOICE') {
                var choices = q.question.choices;
                choices.unshift('choices');
                var results = q.results;
                results.unshift('responses');
                d.resolve([results, choices ]);
              } else if (q.question.type === 'TRUE_FALSE') {
                var results = q.results;
                results.unshift('responses');
                d.resolve([ results, ['choices', 'true', 'false']]);
              }
            }
          });
        }
      }
    }]);
