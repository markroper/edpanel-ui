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

      var sectionDataDeferred = $q.defer();
      statebag.studentSectionsPromise = sectionDataDeferred.promise;
      api.studentSectionsData.get(
        {
          studentId: statebag.currentStudent.id,
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id,
          termId: statebag.currentTerm.id,
        }, function(studentSectionDashData) {
          var sections = [];
          for(var i = 0; i < studentSectionDashData.length; i++) {

            if(!studentSectionDashData[i].studentAssignments ||
              studentSectionDashData[i].studentAssignments.length === 0) {
              continue;
            }
            var section = studentSectionDashData[i].section;
            //Set up the assignments promise
            var deferred = $q.defer();
            section.assignmentsPromise = deferred.promise;
            deferred.resolve(studentSectionDashData[i].studentAssignments);
            //Transform the grade weights:
            var weights = {};
            var arrayWeights = [];
            if(section.gradeFormula) {
              weights = section.gradeFormula.assignmentTypeWeights;
              for(var key in weights) {
                var tempArr = [];
                tempArr.push(key.toLowerCase());
                tempArr.push(Math.round(weights[key]));
                arrayWeights.push(tempArr);
              }
            } else {
              section.gradeFormula = {};
            }
            if(arrayWeights.length === 0) {
              arrayWeights.push(["Total points", 100]);
            }
            section.gradeFormula.assignmentTypeWeights = arrayWeights;
            //Weekly grade progression:
            console.log(studentSectionDashData);
            var gradeResults = studentSectionDashData[i].gradeProgression;
            section.grade = statebagApiManager.resolveGrade(gradeResults.currentOverallGrade);

            section.gradeProgression = gradeResults.weeklyGradeProgression;
            section.currentCategoryGrades = gradeResults.currentCategoryGrades;
            section["goal"] = studentSectionDashData[i].gradeGoal;
            section.proposedValue = section.goal.desiredValue;
            console.log(studentSectionDashData[i].gradeGoal);
            console.log("STUFF");
            console.log(section.goal);
            console.log(section.course.name);
            section.goal["nameId"] = section.course.name.replace(/\s/g, "-");
            console.log(section.goal.nameId);
            sections.push(section);
          }

          $scope.sections = sections;
          statebag.sections = $scope.sections;
          sectionDataDeferred.resolve(sections);
        });
    }
    /*
     * Maps a numeric grade to a letter grade for display
    */

  }]);
