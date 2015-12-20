'use strict';
angular.module('teacherdashboard')
  .directive('surveyResponse', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication',
    function($window, api, $rootScope, $state, $mdToast, authentication) {
      return {
        scope: {
          survey: '=',
          surveyResponse: '=',
          questionsAndAnswers: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/survey/surveyResponse.html',
        replace: true,
        link: function($scope) {
          /* Survey responses must go to the API in the form:
           {
             respondent: { id: 0 },
             responseDate: '2015-12-20',
             survey: { id: 0 },
             answers: [
               {
                 type: 'OPEN_RESPONSE',
                 question: {
                  question: 'how are you?', responseRequired: true, type: 'OPEN_RESPONSE'
                 },
                 answer: 'text'
               },
               {
                 type: 'TRUE_FALSE',
                 question: {
                  question: 'how are you?', responseRequired: true, type: 'TRUE_FALSE'
                 },
                 answer: true
               },
               {
                 type: 'MULTIPLE_CHOICE',
                 question: {
                  question: 'how are you?', responseRequired: true, type: 'MULTIPLE_CHOICE'
                 },
                 answer: 2
               },
             ]
           }
           */
          $scope.submitResponse = function() {
            //Prepare the submission object from whats on the form page:
            var responseToSubmit = {
              respondent: { id: authentication.identity().id, type: 'STUDENT' },
              responseDate: $window.moment().format('YYYY-MM-DD'),
              survey: { id: $scope.survey.id },
              answers: $scope.questionsAndAnswers
            };
            responseToSubmit.answers.forEach(function(answer){
              delete answer.$$hashKey;
              answer.type = answer.question.type;
              if(answer.question.type === 'MULTIPLE_CHOICE') {
                answer.answer = Number(answer.answer);
              }
            });

            //POST if create, PUT if update
            if($scope.surveyResponse) {
              //UPDATE
              api.surveyResponse.put(
                {
                  surveyId: $scope.survey.id,
                  responseId: $scope.surveyResponse.id
                },
                responseToSubmit,
                function() {
                  console.log('success updating');
                }
              );
            } else {
              //CREATE
              api.surveyResponse.post(
                {
                  surveyId: $scope.survey.id
                },
                responseToSubmit,
                function() {
                  console.log('success creating');
                }
              );
            }

          };
          $scope.cancelResponse = function() {
            $scope.survey = null;
          };
        }
      };
    }]);
