'use strict';
angular.module('teacherdashboard')
  .directive('attendancetable', [ '$window', 'api', function($window, api) {
    return {
      scope: {
        attendanceDataPromise: '=',
        slideClosed: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/attendancetable/attendancetable.html',
      replace: true,
      controllerAs: 'ctrl',
      link: function(scope, elem){
        scope.attendanceData = [];
        scope.tableConfig = {
          data: 'attendanceData',
          enableColumnMenus: false,
          paginationPageSize: 8,
          paginationPageSizes: [8, 20, 50, 100],
          enablePaginationControls: true,
          columnDefs: [
            { field: 'student.name', name:'Student' },
            { field: 'schoolDay.date', name:'Date', type: 'date', cellFilter: 'date:\'yyyy-MM-dd\'' },
            { field: 'type', name: 'Type' },
            { field: 'status', name: 'Status' },
            { field: 'sourceSystemPeriodId', name: 'Period' }
          ]
        };
        scope.attendanceDataPromise.then(function(theData){
          scope.attendanceData = theData;
        });
      }
    };
  }]);
