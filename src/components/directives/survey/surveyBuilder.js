'use strict';
angular.module('teacherdashboard')
  .directive('surveyBuilder', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication',
  function($window, api, $rootScope, $state, $mdToast, authentication) {
    return {
      scope: {
        school: '=',
        sections: '=',
        surveyType: '=',
        survey: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/survey/surveyBuilder.html',
      replace: true,
      link: function($scope){
        $scope.minDate = $window.moment().toDate();
        $scope.maxDate = $window.moment().add(1, 'years').toDate();
        $scope.addQuestion = function() {
          if(!$scope.survey.questions) {
            $scope.survey.questions = [];
          }
          $scope.survey.questions.push(
            { question:'', responseRequired: false, type: 'OPEN_RESPONSE' });
        };
        $scope.createSurvey = function() {
          var surveyToCreate = {};
          angular.copy($scope.survey, surveyToCreate);
          //Prepare the survey for the API call to create its
          if($scope.surveyType.type === 'school' && $scope.school) {
            surveyToCreate.schoolFk = $scope.school.id;
            if($scope.survey.sectionFk) {
              delete surveyToCreate.sectionFk;
            }
          } else if($scope.surveyType.type === 'section' && $scope.school && $scope.section) {
            surveyToCreate.schoolFk = $scope.school.id;
            surveyToCreate.sectionFk = $scope.section.id;
          }
          surveyToCreate.administeredDate = $window.moment(surveyToCreate.administeredDate).format('YYYY-MM-DD');
          surveyToCreate.questions.forEach(function(question) {
            delete question.$$hashkey;
            if(question.type === 'MULTIPLE_CHOICE') {
              var choices = [];
              question.choices.forEach(function(choice){
                if(choice.val) {
                  choices.push(choice.val);
                }
              });
              question.choices = choices;
            }
          });
          //resolve creating user, currently logged in user
          surveyToCreate.creator = {
            id: authentication.identity().id,
            type: authentication.identity().roles[0],
          };
          api.survey.post(
            {},
            surveyToCreate,
            function(){
              if($rootScope.previousState) {
                $mdToast.show(
                  $mdToast.simple()
                    .content('Survey saved')
                    .hideDelay(2000)
                );
                $state.go($rootScope.previousState, $rootScope.previousStateParams);
              }
            },
            function() {
              $mdToast.show(
                $mdToast.simple()
                  .content('Could not save survey')
                  .hideDelay(2000)
              );
              $state.go($rootScope.previousState, $rootScope.previousStateParams);
            });
        };
        $scope.cancelCreateSurvey = function() {
          if($rootScope.previousState) {
            $state.go($rootScope.previousState, $rootScope.previousStateParams);
          }
        };
      }
    };
  }]);
