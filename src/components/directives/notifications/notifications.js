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
        link: function ($scope, $elem) {
          $scope.removalfunction = function() {
            console.log("FSDFDSFDS");
          }
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
          $scope.formatNumber = function(num, n) {
            var returnVal = Math.round(num * 10)/10;
            if(n.notification.window && n.notification.window.triggerIsPercent) {
              returnVal = returnVal + '%';
            }
            return returnVal;
          };
          $scope.message = { body: '' };
          $scope.renderNotifications = function() {
            if ($scope.isOpen) {
              $scope.isOpen = false;
              $mdMenu.hide();
            } else {
              $scope.isOpen = true;
            }

            console.log($scope.notificationList);
            //$elem.find('.notification-list').append($compile(listMarkup)($scope));
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
