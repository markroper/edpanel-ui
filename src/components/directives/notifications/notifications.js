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

          $scope.notificationTypes = {
            'GPA': 'GPA',
            'SECTION_GRADE': 'Class grade',
            'ASSIGNMENT_GRADE': 'Assignment grade',
            'BEHAVIOR_SCORE': 'Behavior score',
            'HOMEWORK_COMPLETION': 'Homework completion',
            'SCHOOL_ABSENCE': 'Absence (daily)',
            'SCHOOL_TARDY': 'Tardy (daily)',
            'SECTION_ABSENCE': 'Absence (class)',
            'SECTION_TARDY': 'Tardy (class)'
          };
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
