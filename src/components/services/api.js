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
      //Notifications
      getTriggeredNotifications: $resource(base + '/notifications/users/:userId/triggerednotifications', {}, {
        'get': { isArray: true }
      }),
      dismissTriggeredNotification: $resource(
        base + '/notifications/:notificationId/triggerednotifications/:triggeredId/users/:userId', {}, {
          'put': { method: 'PUT' }
        }),
      notificationsForUser: $resource(base + '/notifications/users/:userId', {}, {
        'get': { method: 'GET', isArray: true }
      }),
      notifications: $resource(base + '/notifications/:notificationId', {}, {
        'getAll': { method: 'GET', isArray: true },
        'get': { method: 'GET' },
        'post': { method: 'POST', headers: {'Content-Type': 'application/json' }},
        'put': { method: 'PUT', headers: {'Content-Type': 'application/json' }},
        'delete': { method: 'DELETE' }
      }),
      messageThreads: $resource(base + '/messagethreads/:threadId', {}, {
        'post': { method: 'POST', headers: {'Content-Type': 'application/json' }},
        'delete': { method: 'DELETE' }
      }),
      messages: $resource(base + '/messagethreads/:threadId/messages/:messageId', {}, {
        'post': { method: 'POST', headers: {'Content-Type': 'application/json' }},
        'delete': { method: 'DELETE' }
      }),
      //Survey
      survey: $resource(base + '/surveys/:surveyId', {},
        {
          'get': { isArray: true },
          'getOne': { method: 'GET' },
          'post': { method: 'POST', headers: {'Content-Type': 'application/json' }},
          'delete': { method: 'DELETE' }
        }),
      surveyByRespondent: $resource(
        base + '/surveys/schools/:schoolId/years/:yearId/terms/:termId/respondents/:respondentId',
        {},
        {'get': { isArray: true }}),
      surveyBySchool: $resource(base + '/surveys/schools/:schoolId', {}, { 'get': { isArray: true }}),
      surveyBySection: $resource(base + '/surveys/schools/:schoolId/sections/:sectionId',
        {},
        {
          'get': { isArray: true }
        }),
      surveyByCreator: $resource(base + '/surveys/users/:userId', {}, { 'get': { isArray: true }}),
      surveyResponses: $resource(base + '/surveys/respondents/:respondentId/responses', {}, { 'get': { isArray: true }}),
      surveyResponse: $resource(base + '/surveys/:surveyId/responses/:responseId',
        {},
        {
          'put': { method:'PUT', headers: {'Content-Type': 'application/json'} },
          'post': { method:'POST', headers: {'Content-Type': 'application/json'} }
        }),
      surveyAggregateResults: $resource(base + '/surveys/:surveyId/responses/aggregates'),
      //Password
      changePassword: $resource(base + '/users/passwordReset/:userId', {},
        {'put': { method:'PUT', headers: {'Content-Type': 'application/json'} }}),
      authCheck: $resource(base + '/auth'),
      //School endpoints
      school: $resource(base + '/schools/:schoolId', {},
        { put: { method: 'PUT', headers: { 'Content-Type': 'application/json' } } }),
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
      studentDemerits: $resource(
        base + '/ui/students/:studentId/schools/:schoolId/years/:yearId/terms/:termId/teacher/:teacherId',
        {},
        { 'get': { 'isArray': true}}
      ),
      studentPrepScores: $resource(base + '/students/:studentId/prepscores', {}, {'get': {isArray: true }}),
      studentHistoricalGrade: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectId/grades/students/:studId/weeks', {}, {'get':{isArray: false}}),
      studentHwRates: $resource(base + '/students/:studentId/homeworkrates', {}, {'get': {isArray: true }}),
      studentSectionHwRates: $resource(base + '/students/:studentId/homeworkrates/sections/:sectionId', {}, {'get': {isArray: true }}),
      studentAttendance: $resource(base + '/schools/:schoolId/students/:studentId/attendance', {}, {'get': {isArray: true }}),
      studentSectionAttendance: $resource(base + '/schools/:schoolId/students/:studentId/attendance/sections/:sectionId', {}, {'get': {isArray: true }}),
      studentsPrepScores: $resource(base + '/students/prepscores', {}, { 'get': { isArray: true }}),
      studentSectionsData: $resource(base + '/ui/students/:studentId/schools/:schoolId/years/:yearId/terms/:termId', {}, { 'get': { isArray: true }}),
      //Other endpoints
      teacher: $resource(base + '/teachers/:teacherId'),
      teachersInSchool: $resource(base + '/schools/:schoolId/teachers',
        {},
        { 'get': { isArray: true }}),
      teacherSections: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/teachers/:teacherId/sections',
        {},
        {'get': {isArray:true}}),
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
      sectionGrades: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/grades',{}, {'get':{ isArray: true}}),
      studentSectionGradeProgression: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/grades/students/:studentId/weeks'),
      //Query execution
      savedQuery: $resource(base + '/schools/:schoolId/queries/:queryId/results', {}, { 'results': { isArray: true }}),
      query: $resource(base + '/schools/:schoolId/queries/results', {}),
      queryComponents: $resource(base + '/schools/:schoolId/queries/components'),
      dashboard: $resource(base + '/schools/:schoolId/dashboards/:dashboardId',
        {},
        {
          'get': { method: 'GET' },
          'put': { method:'PUT', headers: {'Content-Type': 'application/json'} },
          'post': { method:'POST', headers: {'Content-Type': 'application/json'} }
        }),
      //MCAS
      mcasForStudent: $resource(base + '/schools/:schoolId/students/:studentId/mcas', {}, { 'get':{ isArray: true }}),
      //GPA
      gpa: $resource(base + '/schools/:schoolId/gpas'),
      gpasInSchool: $resource(base + '/gpas', {}, { 'get': { isArray: true } }),
      gpasOverTime: $resource(base + '/gpas/students/:studentId/historicals?groupByWeek=true', {}, { 'get': { isArray: true } }),
      failingClasses: $resource(
        base + '/ui/school/:schoolId/years/:schoolYearId/terms/:termId/classes?breakdown=:breakdownKey',
        {},
        {
          'get': {isArray: true}
        }
      ),
      studentSingleGoal: $resource(
        base + '/students/:studentId/goals/:goalId',
        {},
        {
          'get': {method: 'GET'}
        }),
      studentGoals: $resource(
        base + '/students/:studentId/goals',
        {},
        {
          'get': {isArray: true},
          'post': {method: 'POST', headers: {'Content-Type': 'application/json'}}
        }),
      advisorGoals: $resource(
        base + '/teacher/:staffId/goals',
        {},
        {
          'get': {isArray: true}
        }),
      createGoalNotifications: $resource(
        base + '/notifications/schools/:schoolId/students/:studentId/goals/:goalId',
        {},
        {
          'post' : { method:'POST', headers: {'Content-Type': 'application/json'} }
        }
      ),
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
