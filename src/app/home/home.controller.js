'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', ['$scope', 'api', 'statebag', '$q', function ($scope, api, statebag, $q) {
  		$scope.value = {};
  		$scope.students = [
  			{ 'name' : 'Mark Roper', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 3, 'gpaClass':'70-80' },
  			{ 'name' : 'Ted Morton', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 4, 'gpaClass':'90-100' },
  			{ 'name' : 'Jordan Winch', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 2, 'gpaClass':'50-60' },
  			{ 'name' : 'Jarrett Man', 
  				'behavior': 65, 'behaviorClass': '60-70', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 3, 'gpaClass':'70-80' },
  		];

      var context = this;
      var promises = [];
      promises.push(api.schools.get(
        {},
        //Success callback
        function(data){
            statebag.school = data[0];
        },
        //Error callback
        function(error){
            alert('failed to resolve the school!');
        }).$promise);

      promises.push(api.students.get(
        {},
        //Success callback
        function(data){
          statebag.students = data;
        },
        //Error callback
        function(error){
          alert('failed to resolve the students!');
        }).$promise);

      $q.all(promises).then(function(){
        console.log('$q.all().then() callback called!');
      });
  }]);