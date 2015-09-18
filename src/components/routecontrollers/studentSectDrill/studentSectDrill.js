'use strict';
angular.module('teacherdashboard').
controller('StudentSectDrillCtrl', ['$scope','statebag', 'api', '$q', 'statebagApiManager', '$state',
  function ($scope, statebag, api, $q, statebagApiManager, $state) {
  	$scope.assignments = [];
  	var deferred = $q.defer();
  	$scope.chartDataPromise = deferred.promise;

  	if(!statebag.school || !statebag.currentStudent) {
      console.log(JSON.stringify(statebag));
      //Resolve the school then resolve the student
      statebagApiManager.retrieveAndCacheSchool($state.params.schoolId).then(
        function() {
          	//After those promises resolve, resolve the section data
          	api.student.get( 
	      	{ studentId: $state.params.studentId },
	        //Success callback
	        function(data){ 
	          statebag.students = [data]; 
	          statebag.currentStudent = statebag.students[0];
	        });

          	api.section.get(
          	{ 
          		schoolId: statebag.school.id,
          		yearId: statebag.currentYear.id,
          		termId: statebag.currentTerm.id,
          		sectionId: $state.params.sectionId
          	},
          	//Success callback
          	function(section){
          		statebag.currentSection = section;
          		statebag.currentStudentSectionAssignments = api.studentSectionAssignments.get(
	      		{ 
	                studentId: statebag.currentStudent.id,
	                schoolId: statebag.school.id, 
	                yearId: statebag.currentYear.id, 
	                termId: statebag.currentTerm.id,
	                sectionId: statebag.currentSection.id 
	            }, 
	            //success callback
	            function(payload){
	            	$scope.assignments = statebag.currentStudentSectionAssignments;
	                transformAndDisplayAssignments();
	            });
          	});
        },
        function(error) {
          alert('failed to resolve! ' + JSON.stringify(error));
        });
    } else {
    	$scope.assignments = statebag.currentStudentSectionAssignments;
    	transformAndDisplayAssignments();
    }

  	function transformAndDisplayAssignments() {
	  	$scope.chartTitle = 'Assignments For ' + statebag.currentSection.course.name;
	  	var processedAssignments = [];
	  	//resolves when the data comes in
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
	  			deferred.resolve(processedAssignments);
	  		}, 
	  		function(error){

	  		});
  	}
  }]);