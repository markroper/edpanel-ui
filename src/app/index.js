'use strict';

angular.module('teacherdashboard', ['ngAnimate', 'ngCookies', 'ngSanitize', 'ngResource', 'ui.router', 'ngMaterial'])
  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl'
      })
      .state('student', {
      	url: '/student',
      	templateUrl: 'app/student/student.html',
      	controller: 'StudentCtrl'
      })
      .state('reports', {
        url: '/reports',
        templateUrl: 'app/reports/reports.html',
        controller: 'ReportCtrl'
      })
      .state('reportbuilder', {
        url: '/reportbuilder',
        templateUrl: 'app/reportbuilder/reportbuilder.html',
        controller: 'ReportBuilderCtrl'
      });

    $urlRouterProvider.otherwise('/');

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
;
