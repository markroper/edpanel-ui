'use strict';
angular.module('teacherdashboard', ['ngAnimate', 'ngCookies', 'ngSanitize', 'ngResource', 'ui.router', 'ngMaterial', 'ui.grid', 'ui.grid.pagination', 'angular-sortable-view', 'gridster'])
  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider, $httpProvider, $locationProvider, constsProvider) {
    //Forces angular to request that any CORS cookies be sent back by the server
    $httpProvider.defaults.withCredentials = true;
    // use the HTML5 History API
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    var rootUrl = '/ui';
    var roles = constsProvider.$get().roles;
    //Configure the routes!
    $stateProvider
      .state('login', {
        url: rootUrl + '/login',
        templateUrl: rootUrl + '/components/routecontrollers/login/login.html',
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
        templateUrl: rootUrl + '/components/routecontrollers/navinclude/navinclude.html',
        controller: 'NavCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.home', {
        url: 'schools/:schoolId',
        templateUrl: rootUrl + '/components/routecontrollers/home/home.html',
        controller: 'HomeCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.teacherHome', {
        url: 'schools/:schoolId/classes',
        templateUrl: rootUrl + '/components/routecontrollers/teacherhome/teacherhome.html',
        controller: 'TeacherHomeCtrl',
        data: {
          roles: [
            roles.TEACHER,
            roles.SUPER_ADMIN,
            roles.ADMIN
          ]
        }
      })
      .state('app.mySurveys', {
        url: 'mysurveys',
        templateUrl: rootUrl + '/components/routecontrollers/mysurveys/mySurveys.html',
        controller: 'MySurveys',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.myNotifications', {
        url: 'schools/:schoolId/notifications',
        templateUrl: rootUrl + '/components/routecontrollers/notificationmgmt/notificationmgmt.html',
        controller: 'NotificationMgmt',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.mySurveyResponses', {
        url: 'mysurveyresponses',
        templateUrl: rootUrl + '/components/routecontrollers/mysurveyresponses/mySurveyResponses.html',
        controller: 'MySurveyResponses',
        data: {
          roles: [
            roles.STUDENT
          ]
        }
      })
      .state('app.surveyResults', {
        url: 'surveyresults/:surveyId',
        templateUrl: rootUrl + '/components/routecontrollers/surveyresults/surveyResults.html',
        controller: 'SurveyResults',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.resetPassword', {
        url: 'passwordreset/:userId',
        templateUrl: rootUrl + '/components/routecontrollers/resetpassword/resetpassword.html',
        controller: 'PasswordCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.schoolSelector', {
        url: 'schools',
        templateUrl: rootUrl + '/components/routecontrollers/schoolselector/schoolselector.html',
        controller: 'SchoolSelector',
        data: {
          roles: [
            roles.ADMIN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.schoolDash', {
        url: 'schools/:schoolId/dashboard',
        templateUrl: rootUrl + '/components/routecontrollers/schooldash/schoolDash.html',
        controller: 'SchoolDash',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.student', {
      	url: 'schools/:schoolId/student/:studentId?tab',
      	templateUrl: rootUrl + '/components/routecontrollers/student/student.html',
      	controller: 'StudentCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.admin', {
        url: 'schools/:schoolId/admin',
        templateUrl: rootUrl + '/components/routecontrollers/administration/administration.html',
        controller: 'AdministrationCtrl',
        data: {
          roles:[
            roles.ADMIN
          ]
        }
      })
      .state('app.studentSectDrill', {
        url: 'schools/:schoolId/student/:studentId/sections/:sectionId/assignments',
        templateUrl: rootUrl + '/components/routecontrollers/studentSectDrill/studentSectDrill.html',
        controller: 'StudentSectDrillCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.STUDENT,
            roles.GUARDIAN,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.reports', {
        url: 'schools/:schoolId/reports/:reportId',
        templateUrl: rootUrl + '/components/routecontrollers/reports/reports.html',
        //controller: 'ReportCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.SUPER_ADMIN
          ]
        }
      })
      .state('app.reportbuilder', {
        url: 'schools/:schoolId/reportbuilder',
        templateUrl: rootUrl + '/components/routecontrollers/reportbuilder/reportbuilder.html',
        //controller: 'ReportBuilderCtrl',
        data: {
          roles: [
            roles.ADMIN,
            roles.TEACHER,
            roles.SUPER_ADMIN
          ]
        }
      })
    .state('app.advisorGoals', {
      url: 'schools/:schoolId/staff/:staffId/goals',
      templateUrl: rootUrl + '/components/routecontrollers/advisorgoals/advisorgoals.html',
      controller: 'AdvisorGoalsCtrl',
      data: {
        roles: [
          roles.ADMIN,
          roles.TEACHER,
          roles.SUPER_ADMIN
        ]
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

    //The UI uses different color themes for different user types
    $mdThemingProvider.theme('indigo')
        .primaryPalette('indigo');
    $mdThemingProvider.theme('blue-grey')
        .primaryPalette('blue-grey');
    $mdThemingProvider.theme('deep-purple')
        .primaryPalette('deep-purple');
    $mdThemingProvider.theme('red')
        .primaryPalette('red');
    $mdThemingProvider
        .alwaysWatchTheme(true);
  })
  .provider('consts', function(){
    var BLACK = 'Black';
    var ASIAN = 'Asian';
    var PACIFIC_ISLANDER = 'Pacific Islander';
    var AM_INDIAN = 'American Indian';
    var WHITE = 'White';
    var LATINO_HISPANIC = 'Hispanic or Latino';
    var NON_LATINO = 'Not Hispanic or Latino';
    return {
      $get: function () {
        return {
          aggregations: [
            'COUNT',
            'AVG',
            'SUM',
            'STD_DEV',
            'YEARWEEK'
          ],
          placeholderValues: {
            '${schoolId}': 'PLACEHOLDER_NUMERIC',
            '${startDate}': 'PLACEHOLDER_DATE',
            '${endDate}': 'PLACEHOLDER_DATE',
            '${clickValue}': 'PLACEHOLDER_NUMERIC',
            '${clickValueMin}': 'PLACEHOLDER_NUMERIC',
            '${clickValueMax}': 'PLACEHOLDER_NUMERIC'
          },
          notificationTypes: {
            'GPA': 'GPA',
            'SECTION_GRADE': 'Class grade',
            'ASSIGNMENT_GRADE': 'Assignment grade',
            'BEHAVIOR_SCORE': 'Behavior score',
            'HOMEWORK_COMPLETION': 'Homework completion',
            'SCHOOL_ABSENCE': 'Daily absences',
            'SCHOOL_TARDY': 'Daily tardies',
            'SECTION_ABSENCE': 'Class absences',
            'SECTION_TARDY': 'Class tardies'
          },
          roles: {
            ADMIN:'ADMINISTRATOR',
            TEACHER: 'TEACHER',
            STUDENT: 'STUDENT',
            GUARDIAN: 'GUARDIAN',
            SUPER_ADMIN: 'SUPER_ADMINISTRATOR'
          },
          race: {
            BLACK: BLACK,
            ASIAN: ASIAN,
            PACIFIC_ISLANDER: PACIFIC_ISLANDER,
            AM_INDIAN: AM_INDIAN,
            WHITE: WHITE
          },
          ethnicity: {
            LATINO: LATINO_HISPANIC,
            NON_LATINO: NON_LATINO
          },
          ethnicityMap: {
            'YES': LATINO_HISPANIC,
            'NO': NON_LATINO
          },
          raceMap: {
            'B': BLACK,
            'P': PACIFIC_ISLANDER,
            'I': AM_INDIAN,
            'A': ASIAN,
            'W': WHITE
          }
        };
      }
    };
  })
  .factory('UAService', function() {
    return {
      isChrome: /chrome/i.test(navigator.userAgent),
      isSafari: /safari/i.test(navigator.userAgent),
      isIE: /MSIE/i.test(navigator.userAgent),
      isAndroid: /Android/i.test(navigator.userAgent)
    };
  })
  .run(['$rootScope', '$state', '$stateParams', 'authorization',
      function($rootScope, $state, $stateParams, authorization) {
        $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
          // track the state the user wants to go to; authorization service needs this
          $rootScope.toState = toState;
          $rootScope.toStateParams = toStateParams;
          authorization.authorize(event);
        });
        $rootScope.previousState;
        $rootScope.previousStateParams;
        $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
          $rootScope.previousState = from.name;
          $rootScope.previousStateParams = fromParams;
        });
    }
  ]);
