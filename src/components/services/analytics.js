/**
 * Created by cwallace on 1/8/16.
 */
'use strict';
angular.module('teacherdashboard')
  .service('analytics', ['statebag',  '$window', 'consts' , function(statebag, $window, consts){
    function resolveUserRole(role) {

      if (role === consts.roles.ADMIN) {
        return 1;
      } else if (role === consts.roles.SUPER_ADMIN) {
        return 0;
      } else if (role === consts.roles.TEACHER) {
        return 2;
      } else if (role === consts.roles.GUARDIAN) {
        return 3;
      } else if (role === consts.roles.STUDENT) {
        return 4;
      } else {
        return -1;
      }
    }
    return {
      sendEvent: function(category, action, label) {
        $window.ga('send', {
          hitType: 'event',
          eventCategory: category,
          eventAction: action,
          eventLabel: label,
          eventValue: resolveUserRole(statebag.role)
        });
      }
    }
  }]);
