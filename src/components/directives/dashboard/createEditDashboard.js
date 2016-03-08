'use strict';
angular.module('teacherdashboard')
  .directive('createEditDashboard', [ '$window', 'api', '$mdDialog', '$mdMedia', 'statebag',
  function($window, api, $mdDialog, $mdMedia, statebag) {
    return {
      scope: {
        dashboard: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/dashboard/createEditDashboard.html',
      replace: true,
      link: function(scope){
        scope.gridsterOpts = {
          columns: 6,
          swapping: true,
          pushing: true,
          minSizeX: 2,
          maxSizeX: 6,
          minSizeY: 1,
          maxSizeY: 1,
          mobileBreakPoint: 800,
          draggable: {
            enabled: true,
            handle: '.handle'
          }
        };

        scope.dashboardReports = [];
        scope.$watch(
          'dashboard',
          function( newValue, oldValue ) {
            if(newValue && !angular.equals(newValue, oldValue)) {
              scope.dashboardReports = scope.processDashboard();
            }
          }
        );

        scope.editReport = function(ev, rpt) {
          var sc = scope.$new();
          sc.api = api;
          sc.theme = statebag.theme;
          sc.report = rpt;
          $mdDialog.show({
            scope: sc,
            controller: DialogController,
            templateUrl: api.basePrefix + '/components/directives/dashboard/reportBuilderDialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            openFrom: ev.el,
            closeTo: ev.el,
            clickOutsideToClose:true
          }).then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
          }, function() {
            $scope.status = 'You cancelled the dialog.';
          });
        };

        scope.createNewReport = function() {
          //TODO: implement
        };
        scope.deleteReport = function(rpt) {
          //TODO: implement
        };

        scope.processDashboard = function() {
          var gridsterData = [];
          if(scope.dashboard) {
            for (var m = 0; m < scope.dashboard.rows.length; m++) {
              var currRow = scope.dashboard.rows[m];
              for (var n = 0; n < currRow.reports.length; n++) {
                var currReport = currRow.reports[n];
                var gElement = {
                  sizeX: 6 * 1 / currRow.reports.length,
                  //sizeY: 0.5,
                  row: m,
                  col: n * 6 * 1 / currRow.reports.length,
                  report: currReport
                };
                gridsterData.unshift(gElement);
              }
            }
          }
          return gridsterData;
        };
      }
    };
  }]);

var DialogController = function($scope, $mdDialog) {
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
    //TODO: call API to create the report?
  };
};
