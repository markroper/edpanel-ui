'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager',
    function ($scope, api, statebag, $q, $state, statebagApiManager) {
      $scope.showFilter=true;
      //We need to reload the statebag if any relevant values are null or the data is more than 5 minutes old
      if(!statebag.studentPerfData || statebag.lastFullRefresh > (new Date().getTime() - 1000 * 60 * 5))
        {
          var promise = undefined;
          var context = this;
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
        promises.push(api.termTeacherStudents.get(
          {
            schoolId: statebag.school.id, 
            yearId: statebag.currentYear.id, 
            termId: statebag.currentTerm.id,
            //TODO: make this dynamic after merging in Matt G's changes to return user identity in login
            teacherId: 1
          },
          //Success callback
          function(data){
            statebag.students = data;
          },
          //Error callback
          function(){
            alert('failed to resolve the students!');
          }).$promise);

        //After the school and students are resolved, resolve the student performance data
        $q.all(promises).then(function() {
          statebagApiManager.retrieveAndCacheStudentPerfData()
            .then(function(){ $scope.students = statebag.studentPerfData; });
        });
      }
  }]);