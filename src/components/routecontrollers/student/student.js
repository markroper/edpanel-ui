'use strict';
angular.module('teacherdashboard')
.controller('StudentCtrl', ['$scope','statebag', 'api', '$q', '$state', 'statebagApiManager', '$window', '$location', '$anchorScroll','analytics',
  function ($scope, statebag, api, $q, $state, statebagApiManager, $window, $location, $anchorScroll, analytics) {
    $scope.$on('$viewContentLoaded', function() {
      $window.ga('send', 'pageview', { page: "/ui/schools/*/student/*" });
    });
    var GA_PAGE_NAME = 'StudentSection';
    $scope.showFilter=false;
    $scope.students = [];
    $scope.sections = [];
    $scope.approved = [];
    $scope.pending = [];
    console.log("Page loading");
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
                  resolveAllData();
                });
            });
        });
    } else {
      resolveAllData();
    }
    $scope.scrollToCard = function(idName) {
      $location.hash('section-card-' + idName);
      $anchorScroll();
    };

    function resolveAllData() {
      $scope.terms = statebag.currentYear.terms;
      for(var i = 0; i < $scope.terms.length; i++) {
        if($scope.terms[i].id === statebag.currentTerm.id) {
          $scope.currentTerm = $scope.terms[i];
          break;
        }
      }
      $scope.$watch('currentTerm', function(newValue, oldValue) {
        if(newValue !== oldValue) {
          analytics.sendEvent(GA_PAGE_NAME, analytics.CHANGE_TERM, analytics.GRADE_LABEL);
          resolveStudentSectionData();
        }
      });
      resolveStudentSectionData();
      resolveBehaviorData();
      resolveStudentGpa();
      resolveGoals();
    }

    function resolveGoals() {
      api.studentGoals.get(
        {studentId: statebag.currentStudent.id},
        function(results) {
          for (var i = 0; i < results.length; i++) {
            if (results[i].approved) {
              $scope.approved.push(results[i]);
            } else {
              $scope.pending.push(results[i]);
            }
          }
        });
    }

    function resolveStudentGpa() {
      $scope.gpa = {};
      api.gpa.get(
        {schoolId: statebag.school.id, id: [ statebag.currentStudent.id ]},
        function(results) {
          if(results && results[statebag.currentStudent.id]) {
            $scope.gpa.score = Math.round(results[statebag.currentStudent.id] * 10)/10;
          }
        }
      );
    }
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
          startDate: $window.moment(statebag.currentYear.startDate).format('YYYY-MM-DD'),
          endDate: $window.moment().format('YYYY-MM-DD')
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
    }

    function resolveCurrentTermFormula(gradeFormula) {
      var leafChildren = resolveLeafChildrenFormulas(gradeFormula);
      var currDate = $window.moment().valueOf();
      for(var i = 0; i < leafChildren.length; i++){
        var start = $window.moment(leafChildren[i].startDate).valueOf();
        var end = $window.moment(leafChildren[i].endDate).valueOf();
        if(start <= currDate && end >= currDate) {
          return leafChildren[i];
        }
      }
      return gradeFormula;
    }

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
      var sectionDataDeferred = $q.defer();
      statebag.studentSectionsPromise = sectionDataDeferred.promise;
      var termId = statebag.currentTerm.id;
      var currTerm = $scope.currentTerm;
      if(currTerm) {
        termId = currTerm.id;
      }
      api.studentSectionsData.get(
        {
          studentId: statebag.currentStudent.id,
          schoolId: statebag.school.id,
          yearId: statebag.currentYear.id,
          termId: termId
        }, function(studentSectionDashData) {
          var sections = [];
          for(var i = 0; i < studentSectionDashData.length; i++) {

            if (!studentSectionDashData[i].studentAssignments ||
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
            if (section.gradeFormula) {
              weights = resolveCurrentTermFormula(section.gradeFormula).assignmentTypeWeights;
              for (var key in weights) {
                var tempArr = [];
                tempArr.push(key.toLowerCase());
                tempArr.push(Math.round(weights[key]));
                arrayWeights.push(tempArr);
              }
            } else {
              section.gradeFormula = {};
            }
            if (arrayWeights.length === 0) {
              arrayWeights.push(['Total points', 100]);
            }
            section.gradeFormula.assignmentTypeWeights = arrayWeights;
            //Weekly grade progression:
            var gradeResults = studentSectionDashData[i].gradeProgression;
            for (var grade in section.termGrades) {
              if (section.termGrades[grade].startDate === currTerm.startDate &&
                  section.termGrades[grade].endDate === currTerm.endDate) {
                section.grade = section.termGrades[grade].letterGrade;
                break;
              }
            }
            if(!section.grade) {
              section.grade = statebagApiManager.resolveGrade(gradeResults.currentOverallGrade);
            }

            section.gradeProgression = gradeResults.weeklyGradeProgression;
            section.currentCategoryGrades = gradeResults.currentCategoryGrades;
            section.goal = studentSectionDashData[i].gradeGoal;


            section.goal.proposedValue = section.goal.desiredValue;
            section.goal.nameId = section.course.name.replace(/\s/g, '-') + '-' + section.id;
            sections.push(section);
          }

          $scope.sections = sections;
          statebag.sections = $scope.sections;
          sectionDataDeferred.resolve(sections);
        });
    }

  }]);
