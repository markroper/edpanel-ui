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
  .directive('notificationcard', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state', 'consts', 'statebag','$compile','$mdMenu',
    function($window, statebagApiManager, api, authentication, $mdToast, $state, consts, statebag, $compile, $mdMenu) {
      return {
        scope: {
          notification: '=',
          notificationList: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/notificationcard/notificationcard.html',
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
          $scope.formatNumber = function(num, n) {
            var returnVal = Math.round(num * 10)/10;
            if(n.notification.window && n.notification.window.triggerIsPercent) {
              returnVal = returnVal + '%';
            }
            return returnVal;
          };
          $scope.message = { body: '' };
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
          $scope.determineHeading = function(notification) {
            var measure = notification.notification.measure;
            var goal = notification.notification.goal;

            if ('GOAL_APPROVED' == measure) {
              return goal.name + ' Approved';
            } else if ('GOAL_MET' == measure) {
              return goal.name +' Met!';
            }
            else if ('GOAL_UNMET' == measure) {
              return goal.name + ' Not Met';
            }
          };
          $scope.determineBody = function(notification) {
            var measure = notification.notification.measure;
            var goal = notification.notification.goal;
            var userRole = statebag.userRole;
            if (userRole === 'Student') {
              //If student, we want all these to show up in the first person
              if ('GOAL_APPROVED' === measure) {
                return 'Looks good, your ' + goal.name + ' was approved.';
              } else if ('GOAL_MET' === measure) {
                return 'Great job! You met your ' + goal.name + '!';
              }
              else if ('GOAL_UNMET' === measure) {
                return 'Sorry, You didn\'t meet your ' + goal.name + '.';
              }
            } else {
              //Otehrwise, use their name
              if ('GOAL_APPROVED' === measure) {
                return goal.student.name + '\'s ' + goal.name + ' was approved.';
              } else if ('GOAL_MET' === measure) {
                return goal.student.name + ' met their ' + goal.name + '!';
              }
              else if ('GOAL_UNMET' === measure) {
                return goal.student.name + ' didn\'t meet their ' + goal.name + '.';
              }
              else if ('GOAL_CREATED' === measure) {
                return goal.student.name + ' created a goal for you to approve.';
              }
            }

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

          $scope.dismissNotification = function() {
            var supressToast = true;

            api.dismissTriggeredNotification.put(
              {
                notificationId: $scope.notification.notification.id,
                triggeredId: $scope.notification.id,
                userId: authentication.identity().id
              },
              {},
              //Success callback
              function(){
                var index = $scope.notificationList.indexOf($scope.notification);
                if (index != -1) {
                  $scope.notificationList.splice(index,1);
                }

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
                  $mdToast.show(
                    $mdToast.simple()
                      .content('Error dismissing notification')
                      .action('OK')
                      .hideDelay(1500)
                  );
              });
          };
          $scope.goToNotifLocation = function() {
            $mdMenu.hide();
            //Evaluate the notification type, and then send us to the right spot
            $scope.dismissNotification();
            if ($scope.notification.notification.subjects.type === 'SINGLE_STUDENT') {
              if (typeof $scope.notification.notification.goal !== 'undefined') {
                $state.go('app.student', {
                  schoolId: $scope.notification.notification.schoolId,
                  studentId: $scope.notification.subjectUserId,
                  tab: 4});
              } else if ($scope.notification.notification.measure === 'BEHAVIOR_SCORE') {
                $state.go('app.student', {
                  schoolId: $scope.notification.notification.schoolId,
                  studentId: $scope.notification.subjectUserId,
                  tab: 1});
              } else {
                $state.go('app.student', {
                  schoolId: $scope.notification.notification.schoolId,
                  studentId: $scope.notification.subjectUserId,
                  tab: 0});
              }

            }

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
