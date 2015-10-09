'use strict';
angular.module('teacherdashboard')
.controller('AdministrationCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts',
  function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts) {
    api.users.get(
      { schoolId: statebag.school.id,
        enabled: true },
      function(data) {
        $scope.firstTimeUsers = data;
      });
  }]);