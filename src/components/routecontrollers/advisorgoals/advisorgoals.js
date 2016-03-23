'use strict';

angular.module('teacherdashboard')
  .controller('AdvisorGoalsCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window) {
      $scope.approved = [];
      $scope.pending = [];
      $scope.goalsLoaded = false;
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: '/ui/schools/*' });
      });
      console.log($scope.goalsLoaded);
      $scope.goalsLoaded = false;
      statebag.currentPage.name = 'My Student\'s Goals';

      api.advisorGoals.get(
        {
          staffId: authentication.identity().id
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
              //TODO how do we display completed goals
            }
          }
          $scope.goalsLoaded = true;
        },
        //Error callback
        function(){
          console.log('failed to resolve the goals!');
        })

    }]);
