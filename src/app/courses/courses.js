'use strict';
angular.module('studentdashboard')
  .controller('CoursesCtrl', function ($scope) {
  		$scope.math = {
  			grade: 3.5,
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
  			grade: 3.0,
  			course: 'Biology',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'midterm', 20 ],
  				[ 'final', 20 ],
  				[ 'labs', 30 ]
  			]
  		};
  		$scope.physics = {
  			grade: 2.8,
  			course: 'Physics',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 70 ]
  			]
  		};
  		$scope.history = {
  			grade: 3.8,
  			course: 'History',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 20 ],
  				[ 'final paper', 50 ]
  			]
  		};
  		$scope.spanish = {
  			grade: 3.9,
  			course: 'Spanish',
  			gradeWeights: [
  				[ 'homework', 30 ],
  				[ 'final', 30 ],
  				[ 'midterm', 40 ]
  			]
  		};
  });