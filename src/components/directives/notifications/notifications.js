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
  .directive('notifications', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state', 'consts', 'statebag','$compile','$mdMenu',
    function($window, statebagApiManager, api, authentication, $mdToast, $state, consts, statebag, $compile,$mdMenu) {
      return {
        scope: {
          notificationList: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/notifications/notifications.html',
        replace: true,
        link: function ($scope) {
          $scope.renderNotifications = function() {
            if ($scope.isOpen) {
              $scope.isOpen = false;
              $mdMenu.hide();
            } else {
              $scope.isOpen = true;
            }
          };

          $scope.dismissAll = function() {
            if($scope.notificationList) {
              var remaining = [];
              for (var i = 0; i < $scope.notificationList.length; i++) {
                var n = $scope.notificationList[i];
                api.dismissTriggeredNotification.put(
                  {
                    notificationId: n.notification.id,
                    triggeredId: n.id,
                    userId: authentication.identity().id
                  },
                  {},
                  //Success callback
                  function(){},
                  //Error callback
                  function() {
                    remaining.push(n);
                    $mdToast.show(
                      $mdToast.simple()
                        .content('Failed to dismiss notification ' + n.name)
                        .action('OK')
                        .hideDelay(1500)
                    );
                  });
              }
              $scope.notificationList = remaining;
            }
          };


          $scope.goToNotifications = function() {
            $state.go('app.myNotifications', { schoolId: $state.params.schoolId });
          };
        }
      };
    }]);
