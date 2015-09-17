'use strict';
angular.module('teacherdashboard').
controller('StudentSectDrillCtrl', ['$scope','statebag', 'api', '$q', 
  function ($scope, statebag, api, $q) {
  	$scope.assignments = statebag.currentStudentSectionAssignments;
  }]);