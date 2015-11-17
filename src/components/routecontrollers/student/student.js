'use strict';
angular.module('teacherdashboard')
.controller('StudentCtrl', ['$scope','statebag', 'api', '$q', '$state', 'statebagApiManager',
  function ($scope, statebag, api, $q, $state, statebagApiManager) {
    $scope.showFilter=false;
    $scope.students = [];
    $scope.sections = [];
    $scope.goals = [];

    if(!statebag.school || !statebag.currentStudent) {
      //Resolve the school then resolve the student
      statebagApiManager.retrieveAndCacheSchool($state.params.schoolId).then(
        function() {
          //After those promises resolve, resolve the section data
          api.student.get( { studentId: $state.params.studentId },
            //Success callback
            function(data){
              statebag.students = [data];
              statebag.currentStudent = statebag.students[0];
              statebagApiManager.retrieveAndCacheStudentPerfData()
                .then( function(){
                  statebag.studentPerfData.forEach(function(d){
                    if(d.id === data.id) {
                      statebag.currentStudent = d;
                    }
                  });
                  resolveStudentSectionData();
                });
            });
        });
    } else {
      resolveStudentSectionData();

    }

    $scope.sectionClick = function(section) {
      var studentAssignmentsPromise = api.studentSectionAssignments.get({
        studentId: statebag.currentStudent.id,
        schoolId: statebag.school.id,
        yearId: statebag.currentYear.id,
        termId: statebag.currentTerm.id,
        sectionId: section.id }).$promise;

      studentAssignmentsPromise.then(
          //Success callback
          function(payload){
            statebag.currentSection = section;
            statebag.currentStudentSectionAssignments = payload;
            $state.go(
              'app.studentSectDrill',
              {
                schoolId: statebag.school.id,
                studentId: statebag.currentStudent.id,
                sectionId: statebag.currentSection.id
              });
          },
          //Failure callback
          function(error){
            console.log(JSON.stringify(error));
          });
    };


    function resolveStudentSectionData() {
      statebag.currentPage.name = statebag.currentStudent.name;
      $scope.students.push(statebag.currentStudent);
      //GET THE SECTIONS
      var start = new Date().getTime();
      statebag.studentSectionsPromise = api.studentSections.get({
        studentId: statebag.currentStudent.id,
        schoolId: statebag.school.id,
        yearId: statebag.currentYear.id,
        termId: statebag.currentTerm.id,
      }).$promise;
      statebag.studentSectionsPromise.then(
        function(sections){
          var end = new Date().getTime();
          var time = end - start;
          console.log('Section retriveal took: ' + time);
          var sectionGradeResolution = new Date().getTime();

          //Remove sections without assignments to filter out things like lunch & pullout
          var filteredSections = [];
          for(var i = 0; i < sections.length; i++) {
            if(sections[i].assignments && sections[i].assignments.length > 0) {
              filteredSections.push(sections[i]);
            }
          }

          var sectionGradePromises = [];
          for(var i = 0; i < filteredSections.length; i++) { //var sect in sections) {
            var section = filteredSections[i];
            section.assignmentsPromise = api.studentSectionAssignments.get({
              studentId: statebag.currentStudent.id,
              schoolId: statebag.school.id,
              yearId: statebag.currentYear.id,
              termId: statebag.currentTerm.id,
              sectionId: section.id }).$promise;

            //Resolve the current student's grade in the course
            sectionGradePromises.push(api.studentSectionGradeProgression.get({
              studentId: statebag.currentStudent.id,
              schoolId: statebag.school.id,
              yearId: statebag.currentYear.id,
              termId: statebag.currentTerm.id,
              sectionId: section.id
            }).$promise);
            //Transform the grade formula weights into a form that can be used by visualization lib
            var weights = {};
            var arrayWeights = [];
            weights = section.gradeFormula.assignmentTypeWeights;
            for(var key in weights) {
              var tempArr = [];
              tempArr.push(key.toLowerCase());
              tempArr.push(Math.round(weights[key]));
              arrayWeights.push(tempArr);
            }
            section.gradeFormula.assignmentTypeWeights = arrayWeights;
          }
          //When the sections are loaded and the student grades calculated, bind
          //The collection of sections to the scope variable bound to the DOM
          $q.all(sectionGradePromises).then(function(gradeResults){
            var sectionGradeResolutionEnd = new Date().getTime();
            var gradeResTime = sectionGradeResolutionEnd - sectionGradeResolution;
            console.log('Resolution of grades for all sections took took: ' + gradeResTime);
            for(var i = 0; i < gradeResults.length; i++) {
              filteredSections[i].grade = resolveGrade(gradeResults[i].currentOverallGrade);
              filteredSections[i].gradeProgression = gradeResults[i].weeklyGradeProgression;
              filteredSections[i].currentCategoryGrades = gradeResults[i].currentCategoryGrades;
            }
            $scope.sections = filteredSections;
            statebag.sections = $scope.sections;
          });
        },
        function(error){
          console.log('failed to load the student sections and student grades ' + error);
        });
    }
    /*
     * Maps a numeric grade to a letter grade for display
    */
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
