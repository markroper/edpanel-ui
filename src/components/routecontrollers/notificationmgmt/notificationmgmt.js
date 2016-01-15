'use strict';
angular.module('teacherdashboard')
.controller('NotificationMgmt', ['$scope', 'api', '$state', 'statebag', '$window', '$location', 'authentication',
  function ($scope, api, $state, statebag, $window, $location, authentication) {
    statebag.currentPage.name = 'My Notifications';
    $scope.$on('$viewContentLoaded', function () {
      $window.ga('send', 'pageview', { page: $location.url() });
    });
    $scope.notifications = null;
    api.notificationsForUser.get({ userId: authentication.identity().id },
      function(resp){
        $scope.notifications = resp;
      });

    $scope.currentNotification = null;
    $scope.editNotification = function(n) {
      $scope.currentNotification = n;
    };
    $scope.createNewNotification = function() {
      $scope.currentNotification = {};
    };
    $scope.dismissNotification = function() {
      $scope.currentNotification = null;
    };
    $scope.saveNotification = function() {
      if ($scope.currentNotification) {
        if ($scope.currentNotification.id) {
          //update
          api.notifications.put(
            {notificationId: $scope.currentNotification.id},
            $scope.currentNotification,
            function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Notification updated')
                  .action('OK')
                  .hideDelay(1500)
              );
            },
            function () {
              $mdToast.show(
                $mdToast.simple()
                  .content('Could not connect to server, update failed')
                  .action('OK')
                  .hideDelay(1500)
              );
            });

        } else {
          //create
          if ($scope.currentNotification.id) {
            //update
            api.notifications.post(
              {},
              $scope.currentNotification,
              function () {
                $mdToast.show(
                  $mdToast.simple()
                    .content('Notification created')
                    .action('OK')
                    .hideDelay(1500)
                );
              },
              function () {
                $mdToast.show(
                  $mdToast.simple()
                    .content('Could not connect to server, request failed')
                    .action('OK')
                    .hideDelay(1500)
                );
              });
          }
        }
      }
    };
    $scope.resolveSubjects = function(subjects) {
      if(subjects) {
        if(subjects.type === 'SECTION_STUDENTS') {
          return 'students in ' + subjects.section.name;
        } else if(subjects.type === 'SINGLE_STUDENT') {
          return 'student: ' + subjects.student.name;
        } else if(subjects.type === 'SINGLE_TEACHER') {
          return 'single teacher';
        } else if(subjects.type === 'SINGLE_ADMINISTRATOR') {
          return 'single teacher';
        } else if(subjects.type === 'FILTERED_STUDENTS') {
          return 'filtered students';
        } else if(subjects.type === 'SCHOOL_ADMINISTRATORS') {
          return 'All administrators';
        } else if(subjects.type === 'SCHOOL_TEACHERS') {
          return 'All teachers';
        }
      }
      return '';
    };
  }]);
