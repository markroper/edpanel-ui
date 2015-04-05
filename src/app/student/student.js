'use strict';

angular.module('teacherdashboard')
  .controller('StudentCtrl', function ($scope) {
		$scope.students = [
  			{ 'name' : 'Mark Roper', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 3, 'gpaClass':'70-80' }
  		];

  		$scope.math = {
  			grade: '85%',
  			course: 'BC Calc',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'midterm', 20 ],
  				[ 'final', 20 ],
  				[ 'attendence', 10 ],
  				[ 'participation', 10 ]
  			]
  		};
  		$scope.biology = {
  			grade: '80%',
  			course: 'Biology',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'midterm', 20 ],
  				[ 'final', 20 ],
  				[ 'labs', 30 ]
  			]
  		};
  		$scope.physics = {
  			grade: '78%',
  			course: 'Physics',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 70 ]
  			]
  		};
  		$scope.history = {
  			grade: '95%',
  			course: 'History',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 20 ],
  				[ 'final paper', 50 ]
  			]
  		};
  		$scope.spanish = {
  			grade: '84%',
  			course: 'Spanish',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 30 ],
  				[ 'midterm', 40 ]
  			]
  		};
  });