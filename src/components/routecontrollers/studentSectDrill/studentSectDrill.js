'use strict';
angular.module('teacherdashboard').
controller('StudentSectDrillCtrl', ['$scope','statebag', 'api', '$q', 
  function ($scope, statebag, api, $q) {
  	$scope.assignments = statebag.currentStudentSectionAssignments;
  	$scope.chartTitle = 'Assignments For ' + statebag.currentSection.course.name;
  	var processedAssignments = [];
  	$scope.assignments.$promise.then(
  		function(payload){
  			payload.forEach(function(d){
  				if(d.assignment) {
	  				var p = {};
	  				//Resolve grade
	  				if(typeof d.awardedPoints !== 'undefined') {
	  					p.grade = Math.round(d.awardedPoints / d.assignment.availablePoints * 100);
	  				} else {
	  					if(d.completed) {
	  						p.grade = 100;
	  					} else {
	  						p.grade = 0;
	  					}
	  				}
	  				//Due date
	  				p.dueDate = new Date(d.assignment.dueDate);
	  				//Completion date
	  				if(d.completionDate) {
		  				p.completionDate = new Date(d.completionDate);
		  			} else {
		  				p.completionDate = p.dueDate;
		  			}
	  				//Section name
	  				p.category = d.assignment.type.toLowerCase();
	  				//Teacher name
	  				p.teacher = statebag.currentSection.teachers[0].name;
	  				p.assignment = d;
	  				processedAssignments.push(p);
  				}
  			});
  			$scope.chartData = processedAssignments;
  		}, 
  		function(error){

  		});
  }]);