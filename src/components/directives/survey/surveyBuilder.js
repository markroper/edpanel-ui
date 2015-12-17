'use strict';
angular.module('teacherdashboard')
  .directive('surveyBuilder', [ '$window', 'api', function($window, api) {
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
        }
      }
    };
  }]);
