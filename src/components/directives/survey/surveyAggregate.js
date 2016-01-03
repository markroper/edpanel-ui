'use strict';
angular.module('teacherdashboard')
  .directive('surveyAggregate', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication', '$q',
    function($window, api, $rootScope, $state, $mdToast, authentication, $q) {
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
              var results = q.results;
              if (q.question.type === 'MULTIPLE_CHOICE') {
                var choices = q.question.choices;
                choices.unshift('choices');
                results.unshift('responses');
                d.resolve([results, choices ]);
              } else if (q.question.type === 'TRUE_FALSE') {
                results.unshift('responses');
                d.resolve([ results, ['choices', 'true', 'false']]);
              }
            }
          });
        }
      };
    }]);
