'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts) {
      statebag.currentPage.name = "";
      $scope.showFilter=true;
      var roles = consts.roles;
      //We need to reload the statebag if any relevant values are null or the data is more than 5 minutes old
      if(!statebag.studentPerfData || statebag.lastFullRefresh > (new Date().getTime() - 1000 * 60 * 5)) {
        if(!statebag.school) {
          //Resolve the school
          statebagApiManager.retrieveAndCacheSchool($state.params.schoolId).then(
            function() {
              retrieveHomePageData();
            },
            function() {
              retrieveHomePageData();
            });
        } else {
          retrieveHomePageData();
        }
      } else {
        $scope.students = statebag.studentPerfData;
      }

      function retrieveHomePageData() {
        /* This code block makes 1 api call, followed by 2 more api calls if the first one succeeds.
         * The first call resolve the students.  The second two calls
         * resolve different data about each of the students for use on the home page dashboard.
         * When the API calls resolve, the data is formatted a bit and then bound to the controller 
         * scope variables that are bound to DOM elements
        */
        var promises = [];
        //Resolve the students!
        promises.push(resolveStudents());
        //After the school and students are resolved, resolve the student performance data
        $q.all(promises).then(function() {
          statebagApiManager.retrieveAndCacheStudentPerfData()
            .then(function(){ 
              $scope.students = statebag.studentPerfData; 
            });
        });
      }

      function resolveStudents() {
        var identity = authentication.identity();
        if(identity.roles[0] === roles.ADMIN) {
          //retrieve all the students
          return api.allStudents.get(
            { schoolId: statebag.school.id },
            function(data) {
              statebag.students = data;
            }).$promise;
        } else if(identity.roles[0] === roles.TEACHER) {
          //retrieve the teachers current students
          return api.termTeacherStudents.get(
            {
              schoolId: statebag.school.id, 
              yearId: statebag.currentYear.id, 
              termId: statebag.currentTerm.id,
              teacherId: identity.id
            },
            //Success callback
            function(data){
              statebag.students = data;
            },
            //Error callback
            function(){
              console.log('failed to resolve the students!');
            }).$promise;
        } else if(identity.roles[0] === roles.STUDENT) {
          //If the user is a student, no summary data is available, 
          //Therefore redirect to the student page
          statebag.students = [identity];
          $state.go(
            'app.student', 
            { 
              schoolId: statebag.school.id, 
              studentId: identity.id 
            });
        }
      }
  }]);