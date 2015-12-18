'use strict';
angular.module('teacherdashboard')
.service('api', function($resource, $location) {
    var host = $location.host();
    var apiSuffix = '/warehouse/api/v1';
    var base = $location.protocol() + '://' + host;
    //Hack - if we're dealing with localhost, configure the call to run through browsersync
    if(host === 'localhost') {
      base += ':8443';
    }
    base += apiSuffix;
    return {
      login: $resource(base + '/login'),
      logout: $resource(base + '/logout'),
      //Survey
      survey: $resource(base + '/surveys', {},
        {
          'get': { isArray: true },
          'post': { method: 'POST', headers: {'Content-Type': 'application/json' }}
        }),
      surveyBySchool: $resource(base + '/surveys/schools/{schoolId}', {}, { 'get': { isArray: true }}),
      surveyBySection: $resource(base + '/surveys/schools/{schoolId}/sections/{sectionId}',
        {},
        {
          'get': { isArray: true }
        }),
      surveyByCreator: $resource(base + '/surveys/users/{userId}', {}, { 'get': { isArray: true }}),
      //Password
      changePassword: $resource(base + '/users/passwordReset/:userId', {},
        {'put': { method:'PUT', headers: {'Content-Type': 'application/json'} }}),
      authCheck: $resource(base + '/auth'),
      //School endpoints
      school: $resource(base + '/schools/:schoolId'),
      schools: $resource(base + '/schools', {}, { 'get': { isArray: true }}),
      //students enpoints
      student: $resource(base + '/students/:studentId'),
      allStudents: $resource(base + '/students', {}, { 'get': { isArray: true }}),
      users: $resource(base + '/users', {}, {'get': { isArray: true }}),
      unverifiedUsers: $resource(base + '/users/unverified', {}, {'get': { isArray: true }}),
      user: $resource(base + '/users/:userId', {},
        {
          'patch': { method:'PATCH', headers: {'Content-Type': 'application/json'} },
          'put': { method:'PUT', headers: {'Content-Type': 'application/json'} }
        }),
      passwordReset: $resource(base + '/users/requestPasswordReset/:username', {},
        {
          'initiate': { method: 'POST', headers: {'Content-Type': 'application/json'}}
        }),
      termTeacherStudents: $resource(
        base + '/schools/:schoolId/years/:yearId/terms/:termId/teachers/:teacherId/students',
        {},
        { 'get': { isArray: true }}),
      studentGpa: $resource(base + '/students/:studentId/gpa/4'),
      studentBehaviors: $resource(
        base + '/students/:studentId/behaviors',
        {},
        { 'get': { isArray: true }}),
      studentPrepScores: $resource(base + '/students/:studentId/prepscores', {}, {'get': {isArray: true }}),
      studentHwRates: $resource(base + '/students/:studentId/homeworkrates', {}, {'get': {isArray: true }}),
      studentAttendance: $resource(base + '/schools/:schoolId/students/:studentId/attendance', {}, {'get': {isArray: true }}),
      studentsPrepScores: $resource(base + '/students/prepscores', {}, { 'get': { isArray: true }}),
      studentSectionsData: $resource(base + '/ui/students/:studentId/schools/:schoolId/years/:yearId/terms/:termId', {}, { 'get': { isArray: true }}),
      //Other endpoints
      teacher: $resource(base + '/teachers/:teacherId'),
      year: $resource(base + '/schools/:schoolId/years/:yearId'),
      term: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId'),
      terms: $resource(base + '/schools/:schoolId/years/:yearId/terms/',
        {},
        {'get': {isArray:true}}),
      //Sections
      sections: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections', {}, { 'get':{ isArray: true }}),
      section: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId'),
      studentSections: $resource(base + '/students/:studentId/schools/:schoolId/years/:yearId/terms/:termId/sections', {}, { 'get': { isArray: true }}),
      course: $resource(base + '/schools/:schoolId/courses/:courseId'),
      assignment: $resource(base + '/schools/:schoolId/courses/:courseId/sections/:sectionId/assignments/:assignmentId'),
      studentAssignment: $resource(base + '/schools/:schoolId/courses/:courseId/sections/:sectionId/assignments/:assignmentId/studentassignments/:studentassignment'),
      studentSectionAssignments: $resource(
        base + '/students/:studentId/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/studentassignments',
        {},
        { 'get': { isArray: true }}),
      studentSectionGrade: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/grades/students/:studentId'),
      studentSectionGradeProgression: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/grades/students/:studentId/weeks'),
      //Query execution
      savedQuery: $resource(base + '/schools/:schoolId/queries/:queryId/results', {}, { 'results': { isArray: true }}),
      query: $resource(base + '/schools/:schoolId/queries/results', {}),
      //GPA
      gpa: $resource(base + '/schools/:schoolId/gpas'),
      gpasInSchool: $resource(base + '/gpas', {}, { 'get': { isArray: true } }),
      gpasOverTime: $resource(base + '/gpas/students/:studentId/historicals', {}, { 'get': { isArray: true } }),
      failingClasses: $resource(
        base + '/ui/school/:schoolId/years/:schoolYearId/terms/:termId/classes?breakdown=:breakdownKey',
        {},
        {
          'get': {isArray: true}
        }
      ),
      studentGoals: $resource(
        base + '/students/:studentId/goals',
        {},
        {
          'get': {isArray: true},
          'post': {method: 'POST', headers: {'Content-Type': 'application/json'}}
        }),
      editStudentGoal: $resource(
        base + '/students/:studentId/goals/:goalId',
        {},
        {
          'delete': {method: 'DELETE', headers: {'Content-Type': 'application/json'}},
          'patch': { method:'PATCH', headers: {'Content-Type': 'application/json'}}
        },
        { }),
      //UI Attributes
      uiAttributes: $resource(base + '/schools/:schoolId/uiattributes', {},
        {
          'put': { method:'PUT', headers: {'Content-Type': 'application/json'} },
          'post': { method:'POST', headers: {'Content-Type': 'application/json'} }
        }),
      basePrefix: '/ui'
    };
});
