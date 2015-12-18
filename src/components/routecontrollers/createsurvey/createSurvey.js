'use strict';

angular.module('teacherdashboard')
.controller('CreateSurvey', ['$scope', 'api', '$state', 'statebag', '$window', '$location',
  function ($scope, api, $state, statebag, $window, $location) {
    $scope.surveyType = 'school';
    $scope.survey = {
      name: 'mark\s survey',
      administeredDate: $window.moment().toDate(),
      questions: [
        { question: 'what is the question?', required: true, type: 'OPEN_RESPONSE' },
        { question: 'i can\'t hear you', required: false, type: 'TRUE_FALSE' },
        { question: 'pick from choices', required: true, type: 'MULTIPLE_CHOICE', choices: [{val: 'one'}, {val: 'two'}, {val:'buckle my shoe'}] }
      ]
    };
  }]);
