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
        scope.xMenu = { isOpen: false };
        api.queryComponents.get(
          { schoolId: statebag.school.id },
          //Success callback
          function(data){
            scope.queryComponents = data;
          },
          //Error callback
          function(){
            console.log('failed to resolve the school!');
          });

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
          sc.queryComponents = scope.queryComponents;
          sc.queryInProgress = {};
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
            sc.status = 'You said the information was "' + answer + '".';
            if(sc.queryInProgress.x) {
              if(sc.queryInProgress.x.aggregation) {
                //There is a subquery
              } else {
                //There is no subquery
              }
            }
            //If the x-axis has no aggregate function, there is no subquery

            //If there are multiple y-axes, they need to be compatible measures
            //If the y-axis is a dimension, it needs to have a COUNT aggregate function (at present)

            //scope.queryInProgress.y = []

            //scope.queryInProgress.x = {}

            //scope.queryInProgress.series

            //Filter: scope.queryInProgress.group

          }, function() {
            scope.status = 'You cancelled the dialog.';
          });
        };

        scope.createNewReport = function() {
          scope.dashboardReports.unshift({
            sizeX: 6,
            row: 0,
            col:0,
            report: { name: 'New Report', chartQuery: {} }
          });
        };
        scope.deleteReport = function($event, rpt) {
          var idx = scope.dashboardReports.indexOf(rpt);
          scope.dashboardReports.splice(idx, 1);
        };

        scope.saveDashboard = function() {
          scope.$parent.editDashboard = false;
        };

        scope.cancelChanges = function() {
          scope.dashboardReports = scope.processDashboard();
          scope.$parent.editDashboard = false;
        };
        scope.processDashboard = function() {
          var gridsterData = [];
          if(scope.dashboard) {
            for (var m = 0; m < scope.dashboard.rows.length; m++) {
              var currRow = scope.dashboard.rows[m];
              for (var n = 0; n < currRow.reports.length; n++) {
                var currReport = angular.copy(currRow.reports[n]);
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
