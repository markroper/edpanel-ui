'use strict';

angular.module('teacherdashboard')
  .controller('AdvisorGoalsCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window','$mdToast',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window, mdToast) {
      $scope.approved = [];
      $scope.pending = [];
      $scope.completed = [];
      $scope.teachers = [];
      $scope.activeTeacher = false;
      $scope.teachersLoaded = false;
      $scope.goalsLoaded = false;
      $scope.newTeacher = false;
      var deferred = $q.defer();
      $scope.goalsPromise = deferred.promise;

      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: '/ui/schools/*/staff/*/goals' });
      });
      var showSimpleToast = function(msg) {
        mdToast.show(
          mdToast.simple()
            .content(msg)
            .action('OK')
            .hideDelay(2000)
        );
      };
      $scope.goalsLoaded = false;
      statebag.currentPage.name = 'My Students\' Goals';


      api.teachersInSchool.get(
        { schoolId: statebag.school.id },
        function (teachers) {
          $scope.teachers = teachers;
          for (var i = 0; i < teachers.length; i++) {
            if (teachers[i].id === authentication.identity().id ) {
              $scope.activeTeacher = teachers[i].id;
            }
          }
          //When we cahnge the active teacher, reload the goals.
          $scope.$watch('activeTeacher', function(after, before) {
            if(before && !angular.equals(before, after)) {
              $scope.newTeacher = false;
              $scope.goalsLoaded = false;
              $scope.approved = [];
              $scope.pending = [];
              $scope.completed = [];
              resolveGoals(after);
            }
          });
        },
        function () {

        });

      function resolveGoals(teacherId) {
        api.advisorGoals.get(
          {
            staffId: teacherId
          },
          //Success callback
          function(data){
            for (var i = 0; i < data.length; i++) {
              if (data[i].goalProgress === 'IN_PROGRESS') {
                if (data[i].approved) {
                  $scope.approved.push(data[i]);
                } else {
                  $scope.pending.push(data[i]);
                }
              } else {
                console.log(data[i]);
                $scope.completed.push(data[i]);
              }
            }
            deferred.resolve();
            $scope.newTeacher = true;
            $scope.goalsLoaded = true;
          },
          //Error callback
          function(){
            showSimpleToast("An error occurred loading goals");
            console.log('failed to resolve the goals!');
          })
      };

      resolveGoals(authentication.identity().id);



    }]);
