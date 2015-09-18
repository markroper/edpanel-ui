'use strict';
angular.module('teacherdashboard')
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
      lastFullRefresh = null;
}]);