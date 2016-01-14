'use strict';
angular.module('teacherdashboard')
.directive('createNotification', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state',
  function($window, statebagApiManager, api, authentication, $mdToast, $state) {
    return {
      scope: {
        notification: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/notifications/createnotification.html',
      replace: true,
      link: function ($scope) {
      }
    }
  }]);
