'use strict';

angular.module('teacherdashboard')
  .controller('MySurveyResponses', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication', 'statebagApiManager', '$compile',
    function ($scope, api, $state, statebag, $window, $location, authentication, statebagapimanager, $compile) {
      statebag.currentPage.name = 'My Survey Responses';
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: '/ui/mysurveyresponses' });
      });
      $scope.unansweredOnly = false;
      var filterValuesAdded = false;
      $scope.surveyFilter = function(survey) {
        if($scope.unansweredOnly) {
          if(survey.hasResponse) {
            return false;
          } else {
            return true;
          }
        }
        return true;
      };
      $scope.evaluateSurveyFilter = function() {
        if(!filterValuesAdded) {
          var surveyMap = {};
          $scope.surveys.forEach(function(survey){
            surveyMap[survey.id] = survey;
          });
          $scope.responses.forEach(function(resp){
            if(surveyMap[resp.survey.id]) {
              surveyMap[resp.survey.id].hasResponse = true;
            }
          });
        }
      };
      var containerEl = angular.element('.my-survey-responses');
      var responseDirective =
        '<survey-response survey="survey" survey-response="surveyResponse" questions-and-answers="questions" dismiss="dismiss"></survey-response>';
      var oldElem = null;
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
            startDate: $window.moment().subtract(1, 'years').format('YYYY-MM-DD')
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
              questions[a.question.question].answer = a.answer;
            }
          });
        }
        var questionAnswers = Object.keys(questions).map(function (key) {
          return questions[key];
        });
        $scope.questions = questionAnswers;

        if($scope.childScope) {
          $scope.childScope.$destroy();
        }
        $scope.childScope = $scope.$new(false, $scope);
        oldElem = $compile(responseDirective)($scope.childScope);
        containerEl.append(oldElem);
      };

      $scope.dismiss = function() {
        $scope.surveyResponse = null;
        $scope.questions = null;
        $scope.survey = null;
        if($scope.childScope) {
          $scope.childScope.$destroy();
        }
        if(oldElem) {
          oldElem.remove();
          oldElem = null;
        }
      };
    }]);
