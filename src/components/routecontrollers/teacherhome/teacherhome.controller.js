'use strict';

angular.module('teacherdashboard')
  .controller('TeacherHomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window) {
      $scope.$on('$viewContentLoaded', function() {
        //URL Of this page is /ui/schools/1/classes, replace with *
        $window.ga('send', 'pageview', { page: '/ui/schools/*/classes' });
      });

  }]);
