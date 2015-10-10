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
      authCheck: $resource(base + '/auth'),
      //School endpoints
      school: $resource(base + '/schools/:schoolId'),
      schools: $resource(base + '/schools', {}, { 'get': { isArray: true }}),
      //students enpoints
      student: $resource(base + '/students/:studentId'),
      allStudents: $resource(base + '/students', {}, { 'get': { isArray: true }}),
      users: $resource(base + '/users', {}, {'get': { isArray: true }}),
      user: $resource(base + '/users/:userId', {}, 
        { 
          'patch': { method:'PATCH', headers: {'Content-Type': 'application/json'} },
          'put': { method:'PUT', headers: {'Content-Type': 'application/json'} }
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
      //Other endpoints
      teacher: $resource(base + '/teachers/:teacherId'),
      year: $resource(base + '/schools/:schoolId/years/:yearId'),
      term: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId'),
      //Sections
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
      //Query execution
      savedQuery: $resource(base + '/schools/:schoolId/queries/:queryId/results', {}, { 'results': { isArray: true }}),
      query: $resource(base + '/schools/:schoolId/queries/results', {}),
      //GPA
      gpa: $resource(base + '/schools/:schoolId/gpas/4'),
      studentGoals: $resource(
        base + '/students/:studentId/goals',
        {},
        { 'get': { isArray: true }}),
      basePrefix: '/ui'
    };
});
