'use strict';
angular.module('teacherdashboard')
  .controller('SchoolDash', ['$scope', 'api', 'statebag', '$q',  '$window', 'analytics', '$compile', 'authentication',
    function ($scope, api, statebag, $q, $window, analytics, $compile, authentication) {
      $scope.$on('$viewContentLoaded', function () {
        $window.ga('send', 'pageview', { page: '/ui/schools/*/dashboard' });
      });
      statebag.currentPage.name = 'School Dashboard';
      $scope.d = { editDashboard: false };
      $scope.toggleEditMode = function() {
        if (!$scope.d.editDashboard) {
          analytics.sendEvent(analytics.SCHOOL_DASHBOARD, analytics.DASH_EDIT, null);
        }
        $scope.d.editDashboard = !$scope.d.editDashboard;
      };
      $scope.school = statebag.school;
      $scope.resolveQuarterlyExamResults = function() {
        if (!$scope.quarterlyExams) {
          $scope.quarterlyExams = {
            'id': 1,
            'schoolId': 1,
            'rows': [
              {
                'reports': [{
                  'name': 'Q3 Geometry',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [13365, 13369, 13363]
                }, {
                  'name': 'Q3 History',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [13835, 13502, 13498, 13839]
                }]
              },
              {
                'reports': [{
                  'name': 'Q3 Biology',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [13366, 13420, 13422, 13372]
                }, {
                  'name': 'Q3 English',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [13123, 13124, 13908, 13909]
                }]
              },
              {
                'reports': [{
                  'name': 'Q2 Geometry',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [9199, 9270, 9189]
                }, {
                  'name': 'Q2 History',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [8824, 8776, 8775, 8825]
                }]
              },
              {
                'reports': [{
                  'name': 'Q2 Biology',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [9217, 8827, 9388, 8826]
                }, {
                  'name': 'Q2 English',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [8881, 8895, 9302, 9296]
                }]
              },
              {
                'reports': [{
                  'name': 'Q1 Geometry',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [1816, 2694, 1656]
                }, {
                  'name': 'Q1 History',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [449, 304, 254, 400]
                }]
              },
              {
                'reports': [{
                  'name': 'Q1 Biology',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [2216, 3350, 1862, 1984]
                }, {
                  'name': 'Q1 English',
                  'type': 'ASSIGNMENT_ANALYSIS',
                  'assignmentIds': [2828, 2901, 75, 181]
                }]
              }]
          };
        }
      };

      $scope.resolveDashAndTerms = function() {
        $scope.terms = [];
        api.terms.get(
          {
            schoolId: statebag.school.id,
            yearId: statebag.currentYear.id
          },
          function(results) {
            $scope.terms = results;
          });
        //get the dashboard
        api.dashboard.get(
          { schoolId: statebag.school.id, userId: authentication.identity().id },
          function(dashboard) {
            $scope.dashboard = dashboard;
          });
      };
      $scope.$watch(
        'd.editDashboard',
        function( newValue   ) {
          if(newValue === false) {
            $scope.resolveDashAndTerms();
          }
        }
      );
      $scope.resolveDashAndTerms();
    }]);
