'use strict';
angular.module('teacherdashboard')
  .directive('filterChip', ['$state', 'statebag', 'api', '$mdDialog','$compile', '$timeout', '$window',
    function($state, statebag, api, $mdDialog, $compile, $timeout, $window) {
      return {
        scope: {
          filter: '=',
          filterChoices: '=',
          removeFilter: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/filterchip/filterChip.html',
        replace: true,
        controller: function($scope) {
          $scope.requireMatch = true;
          $scope.selectedItem = null;
          $scope.selectedChoices = [];
          var sections = [];
          if($scope.filter.type === 'Section') {
            api.sections.get(
              {
                schoolId: statebag.school.id,
                yearId: statebag.currentYear.id,
                termId: statebag.currentTerm.id
              },
              function (sections) {
                this.sections = sections;
              },
              function () {
                console.log('failed to resolve sections');
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
            'Absenses': { min: 0, max: 20 },
            'Behavior': { min: 0, max: 200 }
          };

          $scope.selectFilter = false;
          $scope.rangeFilter = false;
          if(selectFitlers[$scope.filter.type]) {
            $scope.choices = selectFitlers[$scope.filter.type];
            $scope.selectFilter = true;
          } else if(rangeFilters[$scope.filter.type]) {
            $scope.choices = rangeFilters[$scope.filter.type];
            $scope.rangeFilter = true;
          } else {
            console.log('Filter type not supported :(');
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
