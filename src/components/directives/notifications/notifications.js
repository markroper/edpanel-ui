'use strict';
angular.module('teacherdashboard')
  //WORKING AROUND ng-click auto closing my menu on click
  .directive('edpanelClick', function ($parse) {
    return {
      restrict: 'A',
      compile: function ($element, attrs) {
        var fn = $parse(attrs.edpanelClick, null, true);
        return function myClick(scope, element) {
          element.on('click', function (event) {
            var callback = function () {
              fn(scope, { $event: event });
            };
            scope.$apply(callback);
          });
        };
      }
    };
  })
  .directive('notifications', [ '$window', 'statebagApiManager', 'api',
    function($window, statebagApiManager, api) {
      return {
        scope: {
          notificationList: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/notifications/notifications.html',
        replace: true,
        link: function ($scope) {
          var currentNotification;

          $scope.dismissNotification = function(index, $event) {
            $event.stopPropagation();
            $scope.notificationList.splice(index, 1);
          };

          $scope.dismissAll = function() {
            $scope.notificationList = [];
          };

          $scope.toggleDetails = function(notification, $event) {
            $event.stopPropagation();
            if(currentNotification && currentNotification !== notification) {
              currentNotification.active = false;
            }
            currentNotification = notification;
            if(currentNotification.active) {
              currentNotification.active = false;
            } else {
              currentNotification.active = true;
            }
          };
        }
      };
    }]);
