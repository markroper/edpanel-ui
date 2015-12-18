'use strict';

angular.module('teacherdashboard')
  .controller('MySurveys', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication',
    function ($scope, api, $state, statebag, $window, $location, authentication) {
      statebag.currentPage.name = 'My Surveys';
      api.surveyByRespondent.get(
        {
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id,
          termId: statebag.currentTerm.id,
          respondentId: authentication.identity().id
        },
        function(response){
          $scope.surveys = response;
        }
      );

      api.surveyResponses.get(
        {
          respondentId: authentication.identity().id,
          startDate: $window.moment().format('YYYY-MM-DD')
        },
        function(responses){
          $scope.responses = responses;
        }
      );

      $scope.surveyResponse = function(survey) {
        $scope.survey = survey;

        //Given the survey, find the corresponding response and create array of questions with
        //answers, if there are already response answers.
        if($scope.responses) {
          $scope.responses.forEach(function (resp) {
            if (resp.survey.id === $scope.survey.id) {
              $scope.response = resp;
            }
          });
        }

        var questions = {};
        $scope.survey.questions.forEach(function(q) {
          questions[q.question] = { question: q };
        });
        if($scope.response) {
          $scope.response.answers.forEach(function (a) {
            if (questions[a.question.question]) {
              questions[a.question.question].answer = a.question.answer;
            }
          });
        }
        var questionAnswers = Object.keys(questions).map(function (key) {
          return questions[key];
        });
        $scope.questions = questionAnswers;
      }
    }]);
