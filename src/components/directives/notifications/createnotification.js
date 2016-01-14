'use strict';
angular.module('teacherdashboard')
.directive('createNotification', [ '$window', 'statebagApiManager', 'statebag', 'api', 'authentication', '$mdToast', '$state',
  function($window, statebagApiManager, statebag, api, authentication, $mdToast, $state) {
    return {
      scope: {
        notification: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/notifications/createnotification.html',
      replace: true,
      link: function ($scope) {

        $scope.years = [];
        var currYear = $window.moment().year();
        for(var i = 0; i < 5; i++) {
          $scope.years.push(currYear + i);
        }

        $scope.sections = [ {name: 'all sections'}, { name: 'section one'}, { name: 'section two'}, {name: 'section three'} ];
        $scope.notificationDraft = {
          measure: null,
          subjects: {},
          subscribers: {},
          filters: {

          }
        };

        function createFilterFor(query) {
          var lowercaseQuery = angular.lowercase(query);
          return function filterFn(student) {
            return (angular.lowercase(student.name).indexOf(lowercaseQuery) === 0);
          };
        }

        $scope.querySearch = function(query) {
          var results = query ? statebag.students.filter( createFilterFor(query) ) : statebag.students;
          return results;
        }
        $scope.searchTextChange = function(text) {
          console.log('Text changed to ' + text);
        }

        $scope.selectedItemChange = function(item) {
          console.log('Item changed to ' + JSON.stringify(item));
        }
      }
    }
  }]);
