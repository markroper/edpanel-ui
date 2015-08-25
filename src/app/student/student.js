'use strict';

angular.module('teacherdashboard')
  .controller('StudentCtrl', ['$scope','statebag', 'api', '$q', function ($scope, statebag, api, $q) {
    $scope.students = [];
    $scope.sections = [];
    $scope.students.push(statebag.currentStudent);

    var studentSectionPromise = api.studentSections.get({ 
      studentId: statebag.currentStudent.id, 
      schoolId: statebag.school.id,
      yearId: statebag.currentYear.id,
      termId: statebag.currentTerm.id,
    }).$promise;
    studentSectionPromise.then(
      function(sections){
        var sectionGradePromises = [];
        for(var i = 0; i < sections.length; i++) { //var sect in sections) {
          var section = sections[i];
          //Resolve the current student's grade in the course
          sectionGradePromises.push(api.studentSectionGrade.get({
            studentId: statebag.currentStudent.id,
            schoolId: statebag.school.id,
            yearId: statebag.currentYear.id,
            termId: statebag.currentTerm.id,
            sectionId: section.id
          }).$promise);
          //Transform the grade formula weights into a form that can be used by visualization lib
          var weights = section.gradeFormula.assignmentTypeWeights;
          var arrayWeights = [];
          for(var key in weights) {
            var tempArr = [];
            tempArr.push(key.toLowerCase());
            tempArr.push(weights[key]);
            arrayWeights.push(tempArr);
          }
          section.gradeFormula.assignmentTypeWeights = arrayWeights;
        }
        //When the sections are loaded and the student grades calculated, bind 
        //The collection of sections to the scope variable bound to the DOM
        $q.all(sectionGradePromises).then(function(gradeResults){
          for(var i = 0; i < gradeResults.length; i++) {
            sections[i].grade = resolveGrade(gradeResults[i].grade);
          }
          $scope.sections = sections;
        });
      },
      function(error){
        alert('failed to load the student sections and student grades');
      });

      function resolveGrade(input) {
        if(isNaN(input)) {
          return '--';
        }
        if(input > 94) {
          return 'A';
        } else if(input > 89) {
          return 'A-';
        } else if(input > 86) {
          return 'B+';
        } else if(input > 83) {
          return 'B';
        } else if(input > 79) {
          return 'B-';
        } else if(input > 76) {
          return 'C+';
        } else if(input > 73) {
          return 'C';
        } else if(input > 69) {
          return 'C-';
        } else if(input > 66) {
          return 'D+';
        } else if(input > 63) {
          return 'D';
        } else if(input > 59) {
          return 'D-';
        }
        return 'F';
      }
  }]);