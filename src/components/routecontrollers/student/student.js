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
                  resolveBehaviorData();
                });
            });
        });
    } else {
      resolveStudentSectionData();
      resolveBehaviorData();

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

    /**
     * Resolve the current student's behavior data and add a promise to the scope behaviorDataPromise
     * that resolves with that behavior data when it is returned from the server.
     */
    function resolveBehaviorData() {
      //Cache the isolated scope variables needed for the chorocalendar directive
      $scope.behaviorDataPromise =
        api.studentBehaviors.get({ studentId: statebag.currentStudent.id }).$promise;
      $scope.prepScorePromise =
        api.studentsPrepScores.get({
          studentId: [ statebag.currentStudent.id ],
          startDate: moment(statebag.currentYear.startDate).format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        }).$promise;
    }
    /*
    * Given a section grade formula, recurse to find the leaf node formulas.
    * Calls resolveReportingTermGrades().
    */
    function resolveLeafChildrenFormulas(gradeFormula) {
      var leafChildren = [];
      if(gradeFormula.children && gradeFormula.children.length > 0) {
        for(var i = 0; i < gradeFormula.children.length; i++) {
          leafChildren = leafChildren.concat(resolveLeafChildrenFormulas( gradeFormula.children[i]));
        }
      } else {
        leafChildren.push(gradeFormula);
      }
      return leafChildren;
    };

    /*
    *  Warning, recurisive algorithm that walks to the leaf nodes of
    *  a grade formula graph and returns those leaf nodes as an unsorted array.
    *  This matters for displaying things like quarterly grades where quarters
    *  Are the children of semesters, semesters the children of years, for example.
    */
    function resolveReportingTermGrades(studentSectionDashData) {
      var returnGrades = [];
      if(!studentSectionDashData.section ||
          !studentSectionDashData.section.gradeFormula) {
        return returnGrades;
      }
      var gradeFormula = studentSectionDashData.section.gradeFormula;
      var termGrades = studentSectionDashData.gradeProgression.termGrades;
      if(gradeFormula && termGrades) {
        var leafChildren = resolveLeafChildrenFormulas(gradeFormula);
        for(var i = 0; i < leafChildren.length; i++) {
          var termGrade = {};
          termGrade.name = leafChildren[i].name;
          termGrade.id = leafChildren[i].id;
          termGrade.endDate = leafChildren[i].endDate;
          termGrade.startDate = leafChildren[i].startDate;
          var termScore = termGrades[termGrade.id];
          if(termScore) {
            termGrade.letterGrade = termScore.letterGrade;
            termGrade.score = termScore.score;
            termGrade.comment = termScore.comment;
          }
          returnGrades.unshift(termGrade);
        }
      }
      return returnGrades;
    }

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
            //Get the term-level grades
            section.termGrades =
              resolveReportingTermGrades(studentSectionDashData[i]);
            section.termGrades.sort(function (a, b) {
              if (a.startDate > b.startDate) {
                return 1;
              }
              if (a.startDate < b.startDate) {
                return -1;
              }
              return 0;
            });
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
            var gradeResults = studentSectionDashData[i].gradeProgression;
            section.grade = resolveGrade(gradeResults.currentOverallGrade);
            section.gradeProgression = gradeResults.weeklyGradeProgression;
            section.currentCategoryGrades = gradeResults.currentCategoryGrades;
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
