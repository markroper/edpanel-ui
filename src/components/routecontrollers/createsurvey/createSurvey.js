'use strict';

angular.module('teacherdashboard')
.controller('CreateSurvey', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication',
  function ($scope, api, $state, statebag, $window, $location, authentication) {
    statebag.currentPage.name = 'My Surveys';
    //We need student ID, school, currentYear, currentTerm in order to proceed
    var identity = authentication.identity();
    if(!identity || (!identity.schoolId && !statebag.school)) {
      $state.go('login');
    }

    var resolveSurveysAndSections = function() {
      api.sections.get(
        {
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id,
          termId: statebag.currentTerm.id
        },
        function (response) {
          $scope.sections = response;
        }
      );
      api.surveyByCreator.get(
        {
          userId: identity.id
        },
        function(results){
          $scope.surveys = results;
        });
    };

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
          resolveSurveysAndSections();
        },
        //Error callback
        function () {
          $state.go('login');
        });
    } else {
      resolveSurveysAndSections();
    }

    $scope.createNewSurvey = function(s) {
      $scope.surveyAggregates = null;
      $scope.aggregateSurvey = null;
      $scope.school = statebag.school;
      if(s) {
        $scope.survey = s;
      } else {
        $scope.surveyType = {type: 'school'};
        $scope.survey = {
          name: '',
          administeredDate: $window.moment().toDate(),
          questions: [
            {question: '', responseRequired: false, type: 'OPEN_RESPONSE'}
          ]
        };
      }
    };

    $scope.cloneSurvey = function(survey) {
        var newSurvey = angular.copy(survey);
        newSurvey.id = null;
        if(newSurvey.schoolFk) {
          $scope.surveyType = {type: 'school'};
        }
        $scope.createNewSurvey(newSurvey);
    };

    $scope.deleteSurvey = function(survey) {
      api.survey.delete({surveyId: survey.id},
        function(){
          //TODO: delete succeeded
        },
        function(){
          //TODO: delete failed
        })
    };

    $scope.selectSurveyResponse = function(survey) {
      $scope.survey = null;
      api.surveyAggregateResults.get({ surveyId: survey.id },
        function(resp) {
          $scope.surveyAggregates = resp;
          $scope.aggregateSurvey = survey;
        },
        function() {
          //TODO: handle error
        });

    };
  }]);
