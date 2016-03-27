'use strict';

angular.module('teacherdashboard')
  .controller('AdvisorGoalsCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$window','$mdToast',
    function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $window, mdToast) {
      $scope.approved = [];
      $scope.pending = [];
      $scope.goalsLoaded = false;
      $scope.$on('$viewContentLoaded', function() {
        $window.ga('send', 'pageview', { page: '/ui/schools/*' });
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
          showSimpleToast("An error occurred loading goals");
          console.log('failed to resolve the goals!');
        })

    }]);
