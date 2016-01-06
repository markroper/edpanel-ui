'use strict';

angular.module('teacherdashboard')
  .controller('TeacherHomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window', '$location',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window, $location) {
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: $location.url() });
      });
      statebag.currentPage.name = 'Survey Results';
      console.log("BUTTS");

  }]);
