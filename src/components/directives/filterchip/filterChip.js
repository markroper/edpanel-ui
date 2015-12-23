'use strict';
angular.module('teacherdashboard')
  .directive('filterChip', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',  '$mdToast',
    function($state, statebag, api, $mdDialog, $compile, $timeout, $window, $mdToast) {
      return {
        scope: {
          filter: '=',
          removeFilter: '=',
          filterAdded: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/filterchip/filterChip.html',
        replace: true,
        controller: function($scope) {
          $scope.requireMatch = true;
          $scope.selectFilter = false;
          $scope.rangeFilter = false;
          $scope.selectedItem = null;
          $scope.selectedChoices = [];
          $scope.selectedRange = {};
          //Updated by the chip lists
          $scope.$watch('selectedChoices', function (newVal, oldVal) {
            if((newVal || oldVal) && newVal !== oldVal) {
              $scope.filterAdded($scope.filter, $scope.selectedChoices, 'LIST', newVal, oldVal);
            }
          }, true);
          //Updated by range selector
          $scope.$watch('selectedRange', function (newVal, oldVal) {
            if((newVal || oldVal) && newVal !== oldVal) {
              $scope.filterAdded($scope.filter, $scope.selectedRange, 'RANGE', newVal, oldVal);
            }
          }, true);
          var sections = [];
          var sectionMap = {};
          if($scope.filter.type === 'Section') {
            api.sections.get(
              {
                schoolId: statebag.school.id,
                yearId: statebag.currentYear.id,
                termId: statebag.currentTerm.id
              },
              function (sections) {
                var sectionNames = [];
                sections.forEach(function(s){
                  sectionNames.push(s.name);
                  sectionMap[s.name] = s;
                });
                $scope.choices = sectionNames;
              },
              function () {
                $mdToast.show(
                  $mdToast.simple()
                    .content('Failed to resolve sections')
                    .hideDelay(2000)
                );
              });
          }
          var selectFitlers = {
            'Section': sections,
            'Gender': ['Male', 'Female'],
            'Ethnicity': ['Hispanic or Latino', 'Not Hispanic or Latino'],
            'Race': ['American Indian or Alaska Native', 'Asian', 'Black or African American',
              'Native Hawaiian or Other Pacific Islander', 'White'],
            'Grade Level': [ '5', '6', '7', '8', '9', '10', '11', '12' ]
          };
          var rangeFilters = {
            'GPA': { min: 0, max: 5 },
            'Homework Completion': { min: 0, max: 100 },
            'Absences': { min: 0, max: 20 },
            'Behavior': { min: 0, max: 200 }
          };
          if(selectFitlers[$scope.filter.type]) {
            $scope.choices = selectFitlers[$scope.filter.type];
            $scope.selectFilter = true;
          } else if(rangeFilters[$scope.filter.type]) {
            $scope.choices = rangeFilters[$scope.filter.type];
            $scope.rangeFilter = true;
          } else {
            $mdToast.show(
              $mdToast.simple()
                .content('Filter type not supported')
                .hideDelay(2000)
            );
          }

          function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(vegetable) {
              return angular.lowercase(vegetable).indexOf(lowercaseQuery) !== -1;
            };
          }

          $scope.querySearch = function(query) {
            var results = query ? $scope.choices.filter(createFilterFor(query)) : [];
            return results;
          };

          $scope.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
              return chip;
            }
            // Otherwise, create a new one
            return { name: chip, type: 'new' }
          };
        }
      }
    }]);
