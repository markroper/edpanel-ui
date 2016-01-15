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
  .directive('notifications', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state', 'consts',
    function($window, statebagApiManager, api, authentication, $mdToast, $state, consts) {
      return {
        scope: {
          notificationList: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/notifications/notifications.html',
        replace: true,
        link: function ($scope) {
          var currentNotification;
          $scope.notificationTypes = consts.notifcationTypes;
          $scope.summaryTypes = {
            'SINGLE_STUDENT': false,
            'SINGLE_TEACHER': false,
            'SINGLE_ADMINISTRATOR': false,
            'FILTERED_STUDENTS': true,
            'SECTION_STUDENTS': true,
            'SCHOOL_ADMINISTRATORS': true,
            'SCHOOL_TEACHERS': true
          };
          $scope.aggFunctions = {
            'AVG':'(average) ',
            'SUM':'(sum) '
          };
          $scope.formatNumber = function(num) {
              return Math.round(num * 100)/100;
          };
          $scope.groupTypes = function(n){
            var type = n.notification.subjects.type;
            if('SINGLE_STUDENT' === type) {
              return 'one student';
            } else if ('SINGLE_TEACHER' === type) {
              return 'one teacher';
            } else if ('SINGLE_ADMINISTRATOR' === type) {
              return 'one administrator';
            } else if ('FILTERED_STUDENTS' === type) {
              return 'a filtered set of students';
            } else if ('SECTION_STUDENTS' === type) {
              if(n.notification.subjects.section) {
                return 'students in ' + n.notification.subjects.section.course.name;
              }
              return 'students in one class';
            } else if ('SCHOOL_ADMINISTRATORS' === type) {
              return 'all administrators';
            } else if ('SCHOOL_TEACHERS' === type) {
              return 'all teachers';
            }
          };

          $scope.dismissNotification = function(index, $event, supressToast) {
            if($event) {
              $event.stopPropagation();
            }
            var n = $scope.notificationList[index];
            api.dismissTriggeredNotification.put(
              {
                notificationId: n.notification.id,
                triggeredId: n.id,
                userId: authentication.identity().id
              },
              {},
              //Success callback
              function(){
                $scope.notificationList.splice(index, 1);
                if(!supressToast) {
                  $mdToast.show(
                    $mdToast.simple()
                      .content('Notification dismissed')
                      .action('OK')
                      .hideDelay(1500)
                  );
                }
              },
              //Error callback
              function() {
                if(!supressToast) {
                  $mdToast.show(
                    $mdToast.simple()
                      .content('Failed to reach server :(')
                      .action('OK')
                      .hideDelay(1500)
                  );
                }
              });
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
