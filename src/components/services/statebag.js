'use strict';
angular.module('teacherdashboard')

.service('statebag',[ 'api', '$q', 'consts', function(api, $q, consts) {
  return {
    school : null,
    currentYear : null,
    currentTerm : null,
    currentSection : null,
    currentSections : [],
    //Student caches
    students : [],
    studentPerfData : null,
    currentStudent : null,
    currentStudentSectionAssignments : null,
    currentStudentBehaviorEvents : [],
    currentStudentGpa : null,
    studentsPerformanceSummary : [],
    lastFullRefresh : null,
    studentSectionsPromises: null,
    goals : [],
    sections : [],
    currentPage: {},
    //User UI related caches
    userRole : '',
    theme : 'indigo',
    clearState: function() {
      this.school = null;
      this.currentYear = null;
      this.currentTerm = null;
      this.currentSection = null;
      this.currentSections = [];
      this.students = [];
      this.studentPerfData = null;
      this.currentStudent = null;
      this.currentStudentSectionAssignments = null;
      this.currentStudentBehaviorEvents = [];
      this.currentStudentGpa = null;
      this.studentsPerformanceSummary = [];
      this.lastFullRefresh = null;
      this.studentSectionsPromise = null;
      this.goals = [];
      this.sections = [];
      this.currentPage = {};
      this.userRole = '';
      this.theme = 'indigo';
    },
    resolveTheme: function(inputString) {
      if(inputString === consts.roles.ADMIN) {
        return 'blue-grey';
      }
      if(inputString === consts.roles.TEACHER) {
        return 'deep-purple';
      }
      if(inputString === consts.roles.SUPER_ADMIN) {
        return 'red';
      }
      return 'indigo';
    }
  };
}]);
