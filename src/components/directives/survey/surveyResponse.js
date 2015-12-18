'use strict';
angular.module('teacherdashboard')
  .directive('surveyResponse', [ '$window', 'api', '$rootScope', '$state', '$mdToast', 'authentication',
    function($window, api, $rootScope, $state, $mdToast, authentication) {
      return {
        scope: {
          survey: '=',
          questionsAndAnswers: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/survey/surveyResponse.html',
        replace: true,
        link: function($scope){
          $scope.submitResponse = function() {

          };
          $scope.cancelResponse = function() {

          };
        }
      }
    }]);
