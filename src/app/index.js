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
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.home', {
        url: 'schools/:schoolId',
        templateUrl: rootUrl + '/components/routecontrollers/home/home.html',
        controller: 'HomeCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.student', {
      	url: 'schools/:schoolId/student/:studentId',
      	templateUrl: rootUrl + '/components/routecontrollers/student/student.html',
      	controller: 'StudentCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.studentSectDrill', {
        url: 'schools/:schoolId/student/:studentId/sections/:sectionId/types/:assignmentTypes',
        templateUrl: rootUrl + '/components/routecontrollers/studentSectDrill/studentSectDrill.html',
        controller: 'StudentSectDrillCtrl',
        data: {
          roles: [ADMIN, TEACHER, STUDENT, GUARDIAN, SUPER_ADMIN]
        },
      })
      .state('app.reports', {
        url: 'schools/:schoolId/reports/:reportId',
        templateUrl: rootUrl + '/components/routecontrollers/reports/reports.html',
        //controller: 'ReportCtrl',
        data: {
          roles: [ADMIN, TEACHER, SUPER_ADMIN]
        },
      })
      .state('app.reportbuilder', {
        url: 'schools/:schoolId/reportbuilder',
        templateUrl: rootUrl + '/components/routecontrollers/reportbuilder/reportbuilder.html',
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
