'use strict';

angular.module('teacherdashboard')
  .controller('TeacherHomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window', '$location',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window, $location) {
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: $location.url() });
      });
      statebag.currentPage.name = 'ASS';
      $scope.showFilter=true;
      retrieveTeacherHomeData();
      function retrieveTeacherHomeData() {
        /* This code block makes 1 api call, followed by 2 more api calls if the first one succeeds.
         * The first call resolve the students.  The second two calls
         * resolve different data about each of the students for use on the home page dashboard.
         * When the API calls resolve, the data is formatted a bit and then bound to the controller
         * scope variables that are bound to DOM elements
         */
        var promises = [];
        var sectionGradesPromise = [];
        //Resolve the students!
        promises.push(resolveSections());
        //After the school and students are resolved, resolve the student performance data
        $q.all(promises).then(function() {

          for (var i = 0; i < statebag.currentSections.length; i++) {
            sectionGradesPromise.push(resolveSectionGrades(statebag.currentSections[i], i));
          }
          $q.all(sectionGradesPromise).then(function() {
            $scope.sections = statebag.currentSections;
            console.log($scope.sections);
          });

        });

      }

      function resolveSections() {
        var identity = authentication.identity();
          //retrieve the teachers current students
          return api.teacherSections.get(
            {
              schoolId: statebag.school.id,
              yearId: statebag.currentYear.id,
              termId: statebag.currentTerm.id,
              teacherId: identity.id
            },
            //Success callback
            function(data){
              statebag.currentSections = data;


            },
            //Error callback
            function(){
              console.log('failed to resolve the students!');
            }).$promise;

      }

      function resolveSectionGrades(sectionData, index) {
        return api.sectionGrades.get(
          {
            schoolId: statebag.school.id,
            yearId: statebag.currentYear.id,
            termId: statebag.currentTerm.id,
            sectionId: sectionData.id
          },
          //Success callback
          function(data){
            console.log(data);
            statebag.currentSections[index]["grades"] = data;
            var total = 0;
            for (var i = 0; i < data.length; i++) {
              total += data[i].grade;
            }
            statebag.currentSections[index]["gradeClass"] = statebagApiManager.resolveSectionGradeClass(total/data.length);
            statebag.currentSections[index]["aveGrade"] = total/data.length;
          },
          //Error callback
          function(){
            console.log('failed to resolve the students!');
          }).$promise;
      }

  }]);
