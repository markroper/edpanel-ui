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
  .directive('notifications', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state', 'consts', 'statebag','$compile',
    function($window, statebagApiManager, api, authentication, $mdToast, $state, consts, statebag, $compile) {
      return {
        scope: {
          notificationList: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/notifications/notifications.html',
        replace: true,
        link: function ($scope, $elem) {
          var currentNotification;
          $scope.notificationTypes = consts.notificationTypes;
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
          $scope.message = { body: '' };
          var listMarkup = '<md-list-item layout="column" layout-align="start start" ng-repeat="n in notificationList">'+
          '<div flex class="notification md-list-item-text md-whiteframe-1dp" layout="column" layout-fill edpanel-click="toggleDetails(n, $event)">' +
          '<div edpanel-click="dismissNotification($index, $event)" aria-label="close" class="close-notification-details md-icon-button">' +
          '<md-icon md-font-set="material-icons">close</md-icon>' +
          '</div>' +
          '<div style="padding:15px;" layout="column" class="notification-desc" layout-wrap>' +
          '<span class="md-subhead no-select">{{::n.notification.name}}</span>' +
          '<span class="md-body-1">{{::notificationTypes[n.notification.measure]}} for {{::groupTypes(n)}}</span>' +
          '<span class="md-body-1 notification-detail">The notification threshold of {{::n.notification.triggerValue}} <span ng-show="summaryTypes[n.notification.subjects.type]">{{::aggFunctions[n.notification.aggregateFunction]}}</span>was crossed on {{::n.triggeredDate}} with the value {{::formatNumber(n.valueWhenTriggered)}}.</span>'+
          '</div>' +
          '<div ng-if="n.active" layout="column" layout-fill>' +
            '<div class="message-container">' +
            '<md-input-container class="md-block">'+
            '<label>Message to {{::groupTypes(n)}}</label>' +
            '<textarea ng-model="message.body" columns="1" md-maxlength="250" rows="5"></textarea>' +
            '</md-input-container></div>' +
          '<!--<div class="detailed-content"ng-show="n.active" layout layout-align="center center">DETAILED CONTENT HERE</div>-->' +
          '<div layout layout-align="center center">' +
          '<md-button class="notification-action" ng-click="sendMessage(n)">send message</md-button>' +
          '<md-button class="notification-action" ng-disabled="true">set related goal</md-button>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</md-list-item>';
          $scope.renderNotifications = function() {
            $elem.find('.notification-list').append($compile(listMarkup)($scope));
          };
          $scope.sendMessage = function(n) {
            if(!n.subjectUserId) {
              $mdToast.show(
                $mdToast.simple()
                  .content('Group chats not yet supported :(')
                  .action('OK')
                  .hideDelay(1500)
              );
              return;
            }
            if(!$scope.message.body) {
              $mdToast.show(
                $mdToast.simple()
                  .content('Add message text :(')
                  .action('OK')
                  .hideDelay(1500)
              );
              return;
            }
            var messageThread = {
              participants: [
                { participantId: n.subjectUserId },
                { participantId: authentication.identity().id }
              ]
            };
            api.messageThreads.post(
              {}, messageThread,
              function(resp){
                var message = {
                  thread: { id: resp.id },
                  body: $scope.message.body,
                  sentBy: authentication.identity().id
                };
                api.messages.post(
                  { threadId: resp.id },
                  message,
                  function() {
                    n.active = false;
                    $scope.message.body = '';
                    $mdToast.show(
                      $mdToast.simple()
                        .content('Message sent')
                        .action('OK')
                        .hideDelay(1500)
                    );
                });
              },
              function(){
                $mdToast.show(
                  $mdToast.simple()
                    .content('Group chats not yet supported :(')
                    .action('OK')
                    .hideDelay(1500)
                );
              });
          };
          $scope.groupTypes = function(n){
            var type = n.notification.subjects.type;

            if('SINGLE_STUDENT' === type || n.subjectUserId) {
              if(statebag.students) {
                for(var i = 0; i < statebag.students.length; i++) {
                  if(n.subjectUserId === statebag.students[i].id) {
                    return statebag.students[i].name;
                  }
                }
              }
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
            if(angular.element($event.target).is('textarea')) {
              return;
            }
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
