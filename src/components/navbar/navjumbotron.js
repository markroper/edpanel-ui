'use strict';
angular.module('studentdashboard')
  .directive('navjumbotron', ['$interval', function($interval) {
    return {
      scope: {
      },
      restrict: 'E',
      templateUrl: 'components/navbar/navjumbotron.html',
      replace: true,
      link: function(scope, elem){
          var jumbotronImages = [
            'blackboard',
            'elementaryschool',
            'highschool'
          ];
          var currentImage = 0;
          $interval(function(){
            if(currentImage === jumbotronImages.length) {
              currentImage = 0;
              elem.removeClass(jumbotronImages[jumbotronImages.length - 1]);
            } else {
              elem.removeClass(jumbotronImages[currentImage - 1]);
            }
            elem.addClass(jumbotronImages[currentImage++]);
          }, 8000);
      }
    };
  }]);