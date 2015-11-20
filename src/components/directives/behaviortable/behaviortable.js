'use strict';
angular.module('teacherdashboard')
  .directive('behaviortable', [ '$window', '$compile', '$sanitize','statebag', 'api', function($window, $compile, $sanitize, statebag, api) {
    return {
      scope: {
        behaviorPromise: '=',
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/behaviortable/behaviortable.html',
      replace: true,
      controllerAs: 'ctrl',
      link: function(scope, elem){
        scope.behaviorData = [];
        scope.tableConfig = {
          data: 'behaviorData',
          enableColumnMenus: false,
          paginationPageSize: 7,
          paginationPageSizes: [7, 15, 30, 100],
          enablePaginationControls: true,
          columnDefs: [
            { field: 'behaviorCategory', name:'Category' },
            { field: 'behaviorDate', name:'Date', type: 'date', cellFilter: 'date:\'yyyy-MM-dd\'' },
            { field: 'name', name: 'Description' }
          ]
        };
        scope.behaviorPromise.then(function(theData){
          scope.behaviorData = theData;
        });
      }
    }
  }
]);
