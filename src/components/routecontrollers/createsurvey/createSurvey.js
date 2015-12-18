'use strict';

angular.module('teacherdashboard')
.controller('CreateSurvey', ['$scope', 'api', '$state', 'statebag', '$window', '$location',
  function ($scope, api, $state, statebag, $window) {
    statebag.currentPage.name = 'Create Survey';
    api.sections.get(
      {
        schoolId: statebag.school.id,
        yearId: statebag.currentYear.id,
        termId: statebag.currentTerm.id
      },
      function(response){
        $scope.sections = response;
      }
    );
    $scope.surveyType = { type: 'school' };
    $scope.school = statebag.school;
    $scope.survey = {
      name: '',
      administeredDate: $window.moment().toDate(),
      questions: [
        { question: '', required: false, type: 'OPEN_RESPONSE' },
        //{ question: 'i can\'t hear you', required: false, type: 'TRUE_FALSE' },
        //{ question: 'pick from choices', required: true, type: 'MULTIPLE_CHOICE', choices: [{val: 'one'}, {val: 'two'}, {val:'buckle my shoe'}] }
      ]
    };
  }]);
