'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', function ($scope) {
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
  });