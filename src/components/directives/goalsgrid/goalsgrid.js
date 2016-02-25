'use strict';
angular.module('teacherdashboard')
  .directive('goalsgrid', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window','statebagApiManager',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window, statebagApiManager) {
      return {
        scope: {
          approvedGoals: '=',
          pendingGoals: '=',
          pgoals: '=',
          agoals: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/goalsgrid/goalsgrid.html',
        replace: true,
        controller: function ($scope) {
          console.log($scope.approvedGoals);


        }


      }
    }]);
