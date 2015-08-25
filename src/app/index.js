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
    var rootUrl = '/edpanel';
    var ADMIN = 'ADMIN',
        TEACHER = 'TEACHER',
        STUDENT = 'STUDENT',
        GUARDIAN = 'GUARDIAN',
        SUPER_ADMIN = 'SUPER_ADMIN';

    $stateProvider
      .state('login', {
        url: rootUrl + '/login',
        templateUrl: 'app/login/login.html',
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
        templateUrl: 'app/navinclude/navinclude.html',
        controller: 'SidenavCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.home', {
        url: 'home',
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.student', {
      	url: 'student',
      	templateUrl: 'app/student/student.html',
      	controller: 'StudentCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.reports', {
        url: 'reports',
        templateUrl: 'app/reports/reports.html',
        controller: 'ReportCtrl',
        data: {
          roles: [ADMIN, TEACHER, SUPER_ADMIN]
        },
      })
      .state('app.reportbuilder', {
        url: 'reportbuilder',
        templateUrl: 'app/reportbuilder/reportbuilder.html',
        controller: 'ReportBuilderCtrl',
        data: {
          roles: [ADMIN, TEACHER, SUPER_ADMIN]
        }
      });

    $urlRouterProvider.otherwise(rootUrl + '/');

    $mdIconProvider
      .defaultIconSet('./assets/svg/avatars.svg', 128)
      .icon('menu'       , './assets/svg/menu.svg'        , 24)
      .icon('share'      , './assets/svg/share.svg'       , 24)
      .icon('google_plus', './assets/svg/google_plus.svg' , 512)
      .icon('hangouts'   , './assets/svg/hangouts.svg'    , 512)
      .icon('twitter'    , './assets/svg/twitter.svg'     , 512)
      .icon('phone'      , './assets/svg/phone.svg'       , 512);

      $mdThemingProvider.theme('default')
          .primaryPalette('brown')
          .accentPalette('red');
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
.factory('authorization', ['$rootScope', '$state', 'authentication',
  function($rootScope, $state, authentication) {
    return {
      authorize: function(event) {
        var isAuthenticated = authentication.isAuthenticated();
        if ($rootScope.toState.data.roles && $rootScope.toState.data.roles.length > 0 && 
          !authentication.isInAnyRole($rootScope.toState.data.roles)) {
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
      //School endpoints
      school: $resource(base + '/schools/:schoolId'),
      schools: $resource(base + '/schools', {}, { 'get': { isArray: true }}),
      //students enpoints
      student: $resource(base + '/students/:studentId'),
      students: $resource(base + '/students', {}, { 'get': { isArray: true }}),
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
      studentSectionGrade: $resource(base + '/schools/:schoolId/years/:yearId/terms/:termId/sections/:sectionId/grades/students/:studentId'),
      //Query execution
      savedQuery: $resource(base + '/schools/:schoolId/queries/:queryId/results', {}, { 'results': { isArray: true }}),
      query: $resource(base + '/schools/:schoolId/queries/results', {}),
      //GPA
      gpa: $resource(base + '/schools/:schoolId/gpas/4')
    };
})
.service('statebag', function() {
  var school = null,
      currentYear = null,
      currentTerm = null,
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
