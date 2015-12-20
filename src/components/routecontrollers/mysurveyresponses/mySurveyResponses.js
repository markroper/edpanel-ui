'use strict';

angular.module('teacherdashboard')
  .controller('MySurveyResponses', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication', 'statebagApiManager',
    function ($scope, api, $state, statebag, $window, $location, authentication, statebagapimanager) {
      statebag.currentPage.name = 'My Survey Responses';
      //We need student ID, school, currentYear, currentTerm in order to proceed
      var identity = authentication.identity();
      if(!identity || !identity.schoolId) {
        $state.go('login');
      }

      /**
       * Once we know we have the school and user resolved, this method can be called to
       * resolve relevant surveys and responses
       */
      function resolveSurveysAndResponses() {
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
      }

      //If we don't have the state we need, resolve it and if we can't, redirect to login
      if(!statebag.school) {
        api.school.get(
          { schoolId: identity.schoolId },
          //Success callback
          function (schoolData) {
            statebag.school = schoolData;
            statebag.currentYear = statebagapimanager.resolveCurrentYear();
            statebag.currentTerm = statebagapimanager.resolveCurrentTerm();
            statebag.lastFullRefresh = null;
            resolveSurveysAndResponses();
          },
          //Error callback
          function () {
            $state.go('login');
          });
      } else {
        resolveSurveysAndResponses();
      }

      /**
       * When a user clicks on a survey, the response, if there was a previous response, is associated
       * with the survey and rendered into a form on the page.  If there was no response, than the form is empty.
       * @param survey
       */
      $scope.selectSurveyResponse = function(survey) {
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
      };
    }]);
