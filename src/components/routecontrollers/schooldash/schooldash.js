'use strict';
angular.module('teacherdashboard')
  .controller('SchoolDash', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts) {
      statebag.currentPage.name = statebag.school.name;

    }]);
