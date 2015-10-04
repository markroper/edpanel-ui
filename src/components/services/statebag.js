'use strict';
angular.module('teacherdashboard')
<<<<<<< HEAD
.service('statebag',[ 'api', '$q', function(api, $q) {
    var school = null,
      currentYear = null,
      currentTerm = null,
      currentSection = null,
      currentSections = [],
      //Student caches
      students = [],
      studentPerfData = null,
      currentStudent = null,
      currentStudentSectionAssignments = null,
      currentStudentBehaviorEvents = [],
      currentStudentGpa = null,
      studentsPerformanceSummary = [],
      lastFullRefresh = null,
      goals = [];
}]);
=======
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
    //User UI related caches
    userRole : '',
    theme : 'indigo',
    resolveTheme: function(inputString) {
      if(inputString == consts.roles.ADMIN) {
        return 'blue-grey';
      }
      if(inputString == consts.roles.TEACHER) {
        return 'deep-purple';
      }
      if(inputString == consts.roles.SUPER_ADMIN) {
        return 'red';
      }
      return 'indigo';
    }
  }
}]);
>>>>>>> 96c9384d1f5ebbba1cc92c075295ed02b4ee642b
