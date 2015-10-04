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
    goals : [],
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
