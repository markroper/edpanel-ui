'use strict';
angular.module('teacherdashboard')
  .directive('surveyBuilder', [ '$window', 'api', '$rootScope', '$state', function($window, api, $rootScope, $state) {
    return {
      scope: {
        school: '=',
        section: '=',
        survey: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/survey/surveyBuilder.html',
      replace: true,
      link: function($scope){
        $scope.minDate = moment().toDate();
        $scope.maxDate = moment().add(1, 'years').toDate();

        $scope.addQuestion = function() {
          if(!$scope.survey.questions) {
            $scope.survey.questions = [];
          }
          $scope.survey.questions.push(
            { question:'', required: false, type: 'OPEN_RESPONSE' });
        };
        $scope.createSurvey = function() {
          api.survey.save({}, $scope.survey, function(){
            $state.go($rootScope.previousState, $rootScope.previousStateParams);
          });
        };
        $scope.cancelCreateSurvey = function() {
          $state.go($rootScope.previousState, $rootScope.previousStateParams);
        };
      }
    };
  }]);
