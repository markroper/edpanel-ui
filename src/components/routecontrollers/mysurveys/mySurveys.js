'use strict';
angular.module('teacherdashboard')
.controller('MySurveys', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication','$compile', '$mdToast', 'statebagApiManager','analytics',
  function ($scope, api, $state, statebag, $window, $location, authentication, $compile, $mdToast, statebagapimanager, analytics) {
    statebag.currentPage.name = 'My Surveys';
    $scope.$on('$viewContentLoaded', function() {
      $window.ga('send', 'pageview', { page: '/ui/mysurveys' });
    });
    var surveyBuilderDirective = '<survey-builder survey="survey" survey-type="surveyType" school="school" sections="sections" dismiss="dismissSurveyResults"></survey-builder>';
    //We need student ID, school, currentYear, currentTerm in order to proceed
    var identity = authentication.identity();
    if(!identity || (!identity.schoolId && !statebag.school)) {
      $state.go('login');
    }
    var containerEl = angular.element('.create-survey-controller');
    var oldElem = null;
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
      analytics.sendEvent(analytics.SURVEYS, analytics.SURVEY_CREATE, null);
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
      if($scope.childScope) {
        $scope.childScope.$destroy();
      }
      $scope.childScope = $scope.$new(false, $scope);
      oldElem = $compile(surveyBuilderDirective)($scope.childScope);
      containerEl.append(oldElem);
    };

    $scope.cloneSurvey = function(survey) {
        var newSurvey = angular.copy(survey);
        newSurvey.id = null;
        if(newSurvey.sectionFk) {
          $scope.surveyType = {type: 'section'};
        } else {
          $scope.surveyType = {type: 'school'};
        }
        newSurvey.administeredDate = $window.moment(newSurvey.administeredDate).toDate();
        $scope.createNewSurvey(newSurvey);
    };

    $scope.deleteSurvey = function(survey) {
      analytics.sendEvent(analytics.SURVEYS, analytics.SURVEY_DELETE, null);
      api.survey.delete({surveyId: survey.id},
        function(){
          for(var i = 0; i < $scope.surveys.length; i++) {
            if($scope.surveys[i].id === survey.id) {
              $scope.surveys.splice(i, 1);
              break;
            }
          }
          $scope.surveys
            .filter(function (el) {
              return !angular.equals(el, survey);
            });
          $mdToast.show(
            $mdToast.simple()
              .content('Survey deleted')
              .hideDelay(2000)
          );
        },
        function(){
          $mdToast.show(
            $mdToast.simple()
              .content('Failed to delete survey')
              .hideDelay(2000)
          );
        });
    };

    $scope.selectSurveyResponse = function(survey) {
      statebag.currentSurvey = survey;
      $state.go('app.surveyResults', { surveyId: survey.id });
    };

    $scope.dismissSurveyResults = function() {
      $scope.survey = null;
      //Refresh survey list
      api.surveyByCreator.get(
        {
          userId: identity.id
        },
        function(results){
          $scope.surveys = results;
        });

      if($scope.childScope) {
        $scope.childScope.$destroy();
      }
      if(oldElem) {
        oldElem.remove();
        oldElem = null;
      }
    };
  }]);
