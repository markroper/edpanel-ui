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
          eventLabel: label
        });
      },
      setUserRoleDimension: function(role) {
      $window.ga('set', 'UserRole', role);
    },

      //Categories
      NOTIFICATIONS: 'Notifications',

      //Actions
      GO_TO_NOTIFICATION_LOCATION: 'Go To Not. Location',
      CHANGE_TERM: 'Change Term',
      CHANGE_BREAKDOWN: 'Change Breakdown',
      SHOW_STUDENTS: 'Show Students',
      SHOW_ASSIGNMENTS: 'Show Assignments',
      SHOW_BEHAVIOR: 'Show Behavior',
      SHOW_ATTENDANCE: 'Show Attendance',
      SHOW_HOMEWORK: 'Show Homework',
      SHOW_GRADE: 'Show Grade',
      SHOW_GPA: 'Show GPA',
      SAVE_CHANGES: 'Save Custom Changes',
      ADD_FILTER: 'Add Filter',
      TOGGLE_FILTER: 'Toggle Filter',
      EDIT_GOAL: 'Edit Goal',
      STUDENT_SORT: 'Student Sort',
      OPEN_STUDENT: 'Go to Student',

      //Labels below here
      FAILURE_LABEL: 'FAILURE',
      ATTENDANCE_LABEL: 'ATTENDANCE',
      BEHAVIOR_LABEL: 'BEHAVIOR',
      GOAL_LABEL: 'GOAL',
      ASSIGNMENT_LABEL: 'ASSIGNMENT',
      HOMEWORK_LABEL: 'HOMEWORK',
      STUDENT_LABEL: 'STUDENT',
      GPA_LABEL: 'GPA',
      GRADE_LABEL: 'GRADE',
      CUSTOMIZE_LABEL: 'CUSTOMIZE',
      FILTER: 'FILTER'
    };
  }]);
