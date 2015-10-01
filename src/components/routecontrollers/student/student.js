'use strict';
angular.module('teacherdashboard')
  .controller('StudentCtrl', ['$scope','statebag', 'api', '$q', '$state', 'statebagApiManager', function ($scope, statebag, api, $q, $state, statebagApiManager) {
    $scope.showFilter=false;
    $scope.students = [];
    $scope.sections = [];
    $scope.goals = [];

    if(!statebag.school || !statebag.currentStudent) {
      console.log(JSON.stringify(statebag));
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
        },
        function(error) {
          alert('failed to resolve! ' + JSON.stringify(error));
        });
    } else {
      resolveStudentSectionData();
      resolveStudentGoals()
        .then(function() {
          $scope.goals = statebag.goals;
          resolveGoalDisplay();
        });

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
    }


      function resolveStudentGoals() {
      var deferred = $q.defer();

      var studentGoalsPromises = api.studentGoals.get( {
        studentId: $state.params.studentId }).$promise;

        studentGoalsPromises.then(function (response) {
          console.log(JSON.stringify(response, null, 4));
          statebag.goals = response;
          deferred.resolve(statebag.goals);
        });
        return deferred.promise;
    }

    function resolveGoalDisplay() {
      for (var i = 0; i < $scope.goals.length; i++) {
        var goal = $scope.goals[i];
        switch(goal.goalType) {
          case "ASSIGNMENT":
            goal.line1 = goal.name + ": ";
            goal.line2 = "Assignment Score: ";
            goal.line3 = "Class average: ";
            goal.value1 = goal.desiredValue + "%";
            if (goal.calculatedValue == -1) {
              goal.value2 = "Not Graded"
            } else {
              goal.value2 = goal.calculatedValue + "%";
            }
            goal.value3 = "75%";
                break;
          case "BEHAVIOR":
            switch(goal.behaviorCategory) {
              case "DEMERIT":
                goal.line2 = "Current Demerits: ";
                break;
            }
            goal.line1 = goal.name + ":";
            goal.line3 = "Class average: ";
            goal.value1 = goal.desiredValue;
            goal.value2 = goal.calculatedValue;
            goal.value3 = "3";
                break;
          case "CUMULATIVE_GRADE":
            goal.line1 = goal.name + ":";
            goal.line2 = "Present Grade: ";
            goal.line3 = "Class average: ";
            goal.value1 = goal.desiredValue + "%";
            goal.value2 = goal.calculatedValue + "%";
            goal.value3 = "83%";
                break;
          case "ATTENDANCE":
                break;
        }



        $scope.goals[i] = goal;
      }
    }



    function resolveStudentSectionData() {
      $scope.students.push(statebag.currentStudent);
      var studentSectionsPromise = api.studentSections.get({
        studentId: statebag.currentStudent.id,
        schoolId: statebag.school.id,
        yearId: statebag.currentYear.id,
        termId: statebag.currentTerm.id,
      }).$promise;
      studentSectionsPromise.then(
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
              tempArr.push(Math.round(weights[key]));
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
