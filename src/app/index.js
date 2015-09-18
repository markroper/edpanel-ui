'use strict';

angular.module('teacherdashboard', ['ngAnimate', 'ngCookies', 'ngSanitize', 'ngResource', 'ui.router', 'ngMaterial', 'ui.bootstrap'])
  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider, $httpProvider, $locationProvider) {
    //Forces angular to request that any CORS cookies be sent back by the server
    $httpProvider.defaults.withCredentials = true;
    // use the HTML5 History API
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    var rootUrl = '/ui';
    var ADMIN = 'ADMIN',
        TEACHER = 'TEACHER',
        STUDENT = 'STUDENT',
        GUARDIAN = 'GUARDIAN',
        SUPER_ADMIN = 'SUPER_ADMIN';

    $stateProvider
      .state('login', {
        url: rootUrl + '/login',
        templateUrl: rootUrl + '/app/login/login.html',
        controller: 'LoginController',
        data: {}
      })
      .state('accessdenied', {
        url: rootUrl + '/accessdenied',
        template: '<h2>access denied</h2>',
        data: {}
      })
      .state('app', {
        url: rootUrl + '/',
        templateUrl: rootUrl + '/app/navinclude/navinclude.html',
        controller: 'NavCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.home', {
        url: 'schools/:schoolId',
        templateUrl: rootUrl + '/app/home/home.html',
        controller: 'HomeCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.student', {
      	url: 'schools/:schoolId/student/:studentId',
      	templateUrl: rootUrl + '/app/student/student.html',
      	controller: 'StudentCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.studentSectDrill', {
        url: 'schools/:schoolId/student/:studentId/sections/:sectionId/types/:assignmentTypes',
        templateUrl: rootUrl + '/app/studentSectDrill/studentSectDrill.html',
        controller: 'StudentSectDrillCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.reports', {
        url: 'schools/:schoolId/reports/:reportId',
        templateUrl: rootUrl + '/app/reports/reports.html',
        //controller: 'ReportCtrl',
        data: {
          roles: [ADMIN, TEACHER, SUPER_ADMIN]
        },
      })
      .state('app.reportbuilder', {
        url: 'schools/:schoolId/reportbuilder',
        templateUrl: rootUrl + '/app/reportbuilder/reportbuilder.html',
        //controller: 'ReportBuilderCtrl',
        data: {
          roles: [ADMIN, TEACHER, SUPER_ADMIN]
        }
      });

    $urlRouterProvider.otherwise(rootUrl + '/');

    $mdIconProvider
      .defaultIconSet('/assets/svg/avatars.svg', 128)
      .icon('menu'       , '/ui/assets/svg/menu.svg'        , 24)
      .icon('share'      , '/ui/assets/svg/share.svg'       , 24)
      .icon('google_plus', '/ui/assets/svg/google_plus.svg' , 512)
      .icon('hangouts'   , '/ui/assets/svg/hangouts.svg'    , 512)
      .icon('twitter'    , '/ui/assets/svg/twitter.svg'     , 512)
      .icon('phone'      , '/ui/assets/svg/phone.svg'       , 512);

      $mdThemingProvider.theme('default')
          .primaryPalette('indigo');
  })
.factory('authentication', [function() {
    var _identity,
      _authenticated = false,
      _roles = Object.freeze(['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'SUDO']);

    return {
      getRoles: function() {
        return _roles;
      },
      isIdentityResolved: function() {
        return angular.isDefined(_identity);
      },
      isAuthenticated: function() {
        return _authenticated;
      },
      isInRole: function(role) {
        if (!_authenticated || !_identity.roles) {
          return false;
        }
        return _identity.roles.indexOf(role) !== -1;
      },
      isInAnyRole: function(roles) {
        if (!_authenticated || !_identity.roles) {
          return false;
        }
        for (var i = 0; i < roles.length; i++) {
          if (this.isInRole(roles[i])) {
            return true;
          }
        }
        return false;
      },
      authenticate: function(identity) {
        _identity = identity;
        _authenticated = identity !== null;
      },
      identity: function() {
        return _identity;
      }
    };
  }
])
//Allow or disallow access to a UI route according to authentication & role status
.factory('authorization', ['$rootScope', '$state', 'authentication', 'api',
  function($rootScope, $state, authentication, api) {
    return {
      authorize: function(event) {
        var context = this;
        var isAuthenticated = authentication.isAuthenticated();
        //Is the endpoint role limited?
        if ($rootScope.toState.data.roles && $rootScope.toState.data.roles.length > 0) {
          //Ok, there are roles on this endpoint, if the user is not authenticated
          //from the client perspective, make a call to the server to double check.
          if(!isAuthenticated) {
            this.serverCookieAuthUpdate().then(
              function(){
                context.passthroughOrRedirect();
              }, 
              function(){
                context.passthroughOrRedirect();
              });
          } else {
            context.passthroughOrRedirect();
          }
        }
      },
      passthroughOrRedirect: function() {
        var isAuthenticated = authentication.isAuthenticated();
        //Having checked with the server, do a role check.  if the user can't
          //access the page show an access denied if they're logged in, and redirect
          //to the login page if they're not
          if(!authentication.isInAnyRole($rootScope.toState.data.roles)) {
            //Prevent the previous event from redirecting the URL
            event.preventDefault();
            if (isAuthenticated) { 
              $state.go('accessdenied');
            } else {
              // user is not authenticated. stow the state they wanted before you
              // send them to the signin state, so you can return them when you're done
              $rootScope.returnToState = $rootScope.toState;
              $rootScope.returnToStateParams = $rootScope.toStateParams;
              // now, send them to the signin state so they can log in
              $state.go('login');
            }
          }
      },
      //If the user is not authenticated, call to the server for a cookie check
      //The user may be logged in but clicking a link or refreshing the browser
      //In these cases, JS can't access teh valid cookie we need to ask the server 
      //to interrogate the cookie for us and hand back a user, if there is a valid cookie
      serverCookieAuthUpdate: function() {
        return api.authCheck.get(
          {}, 
          function(data){
            var identity = {
              username: data.identity.name,
              name: data.identity.name,
              id: data.identity.id,
              roles: [data.authorities[0].authority]
            };
          authentication.authenticate(identity);
          }, 
          function(error){
            console.log("we're not authenticated " + JSON.stringify(error));
          }).$promise;
      }
    };
  }
])
//Api service
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
      termTeacherStudents: $resource(base + 
        '/schools/:schoolId/years/:yearId/terms/:termId/teachers/:teacherId/students', 
        {}, 
        { 'get': { isArray: true }}),
      studentGpa: $resource(base + '/students/:studentId/gpa/4'),
      //Other endpoints
      teacher: $resource(base + '/teachers/:teacherId'),
      year: $resource(base + '/schools/:schoolId/years/:yearId'),
      term: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId'),
      //Sections
      section: $resource(base + '/schools/:schoolId/courses/:courseId/sections/:sectionId'),
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
      basePrefix: '/ui'
    };
})
.service('statebag','api', function() {
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
  //Returns a promise
  function retrieveAndCacheSchool(schoolId) {
    return api.school.get(
      { schoolId: schoolId },
      //Success callback
      function(data){
          statebag.school = data;
          statebag.currentYear = statebag.school.years[statebag.school.years.length - 1];
          statebag.currentTerm = statebag.currentYear.terms[statebag.currentYear.terms.length - 1];
      },
      //Error callback
      function(){
          alert('failed to resolve the school!');
    }).$promise
  }
  function retrieveAndCacheStudentPerfData() {
    var deferred = $q.defer();
    var attendanceAndHwQuery = getHwAndAttendanceQuery(statebag.currentYear.id, statebag.currentTerm.id);
    var behaviorQuery = getBehaviorQuery(statebag.currentTerm.startDate, statebag.currentTerm.endDate);
    var studentDataPromises = [];
    //Get attendance & HW completion
    studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, attendanceAndHwQuery).$promise);
    studentDataPromises.push(api.query.save({ schoolId: statebag.school.id }, behaviorQuery).$promise);
    //Get the GPA results
    var studentIds = [];
    for(var i = 0; i < statebag.students.length; i++) {
      studentIds.push(statebag.students[i].id);
    }
    studentDataPromises.push(api.gpa.get({schoolId: statebag.school.id, id: studentIds}).$promise);
    
    //When both the GPA and HW/Attendance queries have returned, populate the objects bound to the DOM!
    $q.all(studentDataPromises).then(function(responses) {
      var resolvedStudents = [];
      var studentMap = {};
      //Handle the HW completion & attendance values
      responses[0].records.forEach(function(student){
        studentMap[student.values[0]] = resolveStudentScopeObject(student.values);
      });
      //Update the behavior demerit counts
      responses[1].records.forEach(function(student) {
        var studentDemerits = student.values;
        var pluckedStudent = studentMap[studentDemerits[0]];
        pluckedStudent.behavior = studentDemerits[1];
        pluckedStudent.behaviorClass = resolveBehaviorClass(pluckedStudent.behavior);
      });
      //Update the GPA
      for (var idKey in responses[2]) {
        if (responses[2].hasOwnProperty(idKey) && 
            !isNaN(idKey)) {
          var pluckedStudent = studentMap[idKey];
          if(pluckedStudent) {
            pluckedStudent.gpa = Math.round( responses[2][idKey] * 10 ) / 10;
            pluckedStudent.gpaClass = resolveGpaClass(pluckedStudent.gpa);
            resolvedStudents.unshift(pluckedStudent);
          }
        }
      }
      statebag.lastFullRefresh = new Date().getTime();
      statebag.studentPerfData = resolvedStudents;
      deferred.resolve(statebag.studentPerfData);
    });
    return deferred.promise;
  }
  function getBehaviorQuery(minDate, maxDate) {
    var behaviorQuery = {
        'aggregateMeasures': [
            {
                'measure': 'DEMERIT',
                'aggregation': 'SUM'
            }
        ],
        'fields': [
            {
                'dimension': 'STUDENT',
                'field': 'ID'
            }
        ],
        'filter': {
            'type': 'EXPRESSION',
            'leftHandSide': {
                'type': 'EXPRESSION',
                'leftHandSide': {
                    'type': 'MEASURE',
                    'value': {
                        'measure': 'DEMERIT',
                        'field': 'Behavior Date'
                    }
                },
                'operator': 'GREATER_THAN',
                'rightHandSide': {
                    'type': 'DATE',
                    'value': minDate
                }
            },
            'operator': 'AND',
            'rightHandSide': {
                'type': 'EXPRESSION',
                'leftHandSide': {
                    'type': 'MEASURE',
                    'value': {
                        'measure': 'DEMERIT',
                        'field': 'Behavior Date'
                    }
                },
                'operator': 'LESS_THAN',
                'rightHandSide': {
                    'type': 'DATE',
                    'value': maxDate
                }
            }
        }
    };
    return behaviorQuery;
  }
  function getHwAndAttendanceQuery(schoolYearId, termId) {
    var attendanceAndHwQuery = {
      'aggregateMeasures': [
        {'measure':'HW_COMPLETION','aggregation':'AVG'},
        {'measure':'ATTENDANCE','aggregation':'SUM'}
      ],
      'fields':[
        {'dimension':'STUDENT','field':'ID'},
        {'dimension':'STUDENT','field':'Name'}
      ],
      'filter': {
        'type':'EXPRESSION',
        'leftHandSide': { 
          'type':'EXPRESSION',
          'leftHandSide':{
            'type':'EXPRESSION',
            'leftHandSide':{
              'value':{'dimension':'TERM','field':'ID'},
              'type':'DIMENSION'},
              'operator':'EQUAL',
              'rightHandSide':{'type':'NUMERIC','value': termId}
            },
            'operator':'AND',
            'rightHandSide':{
              'type':'EXPRESSION',
              'leftHandSide':{
                'value':{'dimension':'YEAR','field':'ID'},
                'type':'DIMENSION'
              },
              'operator':'EQUAL',
              'rightHandSide':{
                'type':'NUMERIC',
                'value': schoolYearId
              }
            }
          },
          'operator':'AND',
          'rightHandSide':{
            'type':'EXPRESSION',
            'leftHandSide':{
              'type':'DIMENSION',
              'value':{'dimension':'SECTION','field':'ID'}
            },
            'operator':'NOT_EQUAL',
            'rightHandSide':{'type':'NUMERIC','value':0
          }
        }
      }
    };
    return attendanceAndHwQuery;
  }
  /*
   * Helper functions below
  **/
  function resolveStudentScopeObject(inputStudent) {
    var student = {};
    student.id = inputStudent[0];
    student.name = inputStudent[1];
    student.behavior = null;
    student.behaviorClass = resolveBehaviorClass(student.behavior);
    student.homework = Math.round(inputStudent[2] * 100);
    student.homeworkClass = resolveHomeworkClass(inputStudent[2]);
    student.attendance = inputStudent[3];
    student.attendanceClass = resolveAttendanceClass(student.attendance);
    student.gpa = null;
    student.gpaClass = resolveGpaClass(student.gpa);
    return student;
  }
  function resolveBehaviorClass(behaviorScore) {
    if(behaviorScore < 35) {
      return '90-100';
    } else if(behaviorScore < 45) {
      return '80-90';
    } else if(behaviorScore < 55) {
      return '70-80';
    } else if(behaviorScore < 65) {
      return '60-70';
    } else if(behaviorScore < 75) {
      return '50-60';
    } else {
      return '40-50';
    }
  }
  function resolveHomeworkClass(homeworkScore) {
    if(homeworkScore < 0.88) {
      return '40-50';
    } else if(homeworkScore < 0.89) {
      return '50-60';
    } else if(homeworkScore < 0.90) {
      return '60-70';
    } else if(homeworkScore < 0.91) {
      return '70-80';
    } else if(homeworkScore < 0.92) {
      return '80-90';
    } else {
      return '90-100';
    }
  }
  function resolveAttendanceClass(attendanceScore) {
    if(attendanceScore < 43) {
      return '90-100';
    } else if(attendanceScore < 46) {
      return '80-90';
    } else if(attendanceScore < 49) {
      return '70-80';
    } else if(attendanceScore < 52) {
      return '60-70';
    } else if(attendanceScore < 55) {
      return '50-60';
    } else {
      return '40-50';
    }
  }
  function resolveGpaClass(gpa) {
    if(gpa > 3.5) {
      return '90-100';
    } else if(gpa > 3.2) {
      return '80-90';
    } else if(gpa > 3.0) {
      return '70-80';
    } else if(gpa > 2.8) {
      return '60-70';
    } else if (gpa > 0){
      return '50-60';
    } else {
      return '0';
    }
  }
})
.run(['$rootScope', '$state', '$stateParams', 'authorization',
    function($rootScope, $state, $stateParams, authorization) {
      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
      // track the state the user wants to go to; authorization service needs this
      $rootScope.toState = toState;
      $rootScope.toStateParams = toStateParams;
      authorization.authorize(event);
    });
  }
]);
