'use strict';
angular.module('teacherdashboard')
  .directive('surveyQuestionBuilder', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        question: '=',
        survey: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/survey/surveyQuestionBuilder.html',
      replace: true,
      link: function($scope){
        $scope.removeQuestion = function(question) {
          $scope.survey.questions =
            $scope.survey.questions.filter(function (el) {
              return el.question !== question.question;
            });
        };
        $scope.removeChoice = function(choice) {
          $scope.question.choices =
            $scope.question.choices.filter(function (el) {
              return el !== choice;
            });
        };
      }
    };
  }]);
