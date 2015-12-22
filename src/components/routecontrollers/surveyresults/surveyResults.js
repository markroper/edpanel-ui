'use strict';
angular.module('teacherdashboard')
  .controller('SurveyResults', ['$scope', 'api', '$state', 'statebag', '$window','$compile', '$stateParams',
    function ($scope, api, $state, statebag, $window, $compile, $stateParams) {
      statebag.currentPage.name = 'Survey Results';
      var surveyResultsDirective =
        '<survey-aggregate aggregate-survey="aggregateSurvey" survey-aggregates="surveyAggregates"></survey-aggregate>';
      //We need student ID, school, currentYear, currentTerm in order to proceed
      var containerEl = angular.element('.survey-results');
      if(!$stateParams.surveyId) {
        $state.go('app.home');
      }

      $scope.selectSurveyResponse = function(survey) {
        $scope.survey = null;
        api.surveyAggregateResults.get({ surveyId: survey.id },
          function(resp) {
            $scope.surveyAggregates = resp;
            $scope.aggregateSurvey = survey;
            if($scope.childScope) {
              $scope.childScope.$destroy();
            }
            $scope.childScope = $scope.$new(false, $scope);
            $scope.childScope.surveyAggregates = resp;
            $scope.childScope.aggregateSurvey = survey;
            containerEl.append($compile(surveyResultsDirective)($scope.childScope));
          },
          function() {
            //TODO: handle error
          });
      };

      if(!statebag.currentSurvey) {
        api.survey.getOne(
          { surveyId: $stateParams.surveyId },
          function(resp){
            $scope.selectSurveyResponse(resp);
          });
      } else {
        $scope.selectSurveyResponse(statebag.currentSurvey);
      }

    }]);
