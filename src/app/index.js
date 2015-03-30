'use strict';

angular.module('teacherdashboard', ['ngAnimate', 'ngCookies', 'ngSanitize', 'ngResource', 'ui.router', 'ngMaterial'])
  .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl'
      });
      // .state('behavior', {
      // 	url: '/behavior',
      // 	templateUrl: 'app/behavior/behavior.html',
      // 	controller: 'BehaviorCtrl'
      // })
      // .state('assignments', {
      // 	url: '/assignments',
      // 	templateUrl: 'app/assignments/assignments.html',
      // 	controller: 'AssignmentsCtrl'
      // })
      // .state('courses', {
      // 	url: '/courses',
      // 	templateUrl: 'app/courses/courses.html',
      // 	controller: 'CoursesCtrl'
      // });

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
