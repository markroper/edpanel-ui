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
      //Pages
      GOALS_TAB: 'GOALS_TAB',
      GOALS_ADVISOR: 'GOALS_ADVISOR',

      //Categories
      NOTIFICATIONS: 'Notifications',
      GOALS: 'Goals',
      SCHOOL_DASHBOARD: 'School Dashboard',
      SURVEYS: 'Survey',
      PINNING: 'Pinning',

      //Actions
      CREATE_PIN: 'Create Pin',
      DELETE_PIN: 'Delete Pin',
      DASH_EDIT: 'Dash Edit',
      DASH_CHANGE_TERM: 'Change Term',
      DASH_CHANGE_BREAKDOWN: 'Change Breakdown',
      DASH_ADD_FILTER: 'Dash Add Filter',
      DASH_EDIT_CHART: 'Dash Chart Edit',
      DASH_DELETE_CHART: 'Dash Delete Chart',
      DASH_ADD_CHART: 'Dash Add Chart',
      DASH_SAVE_CHANGES: 'Dash Save Changes',
      DASH_CANCEL_CHANGES: 'Dash Cancel Changes',
      DASH_PREVIEW_EDIT: 'Dash Preview Edits',
      DASH_SAVE_CHART: 'Dash Save Chart',
      DASH_CANCEL_CHART: 'Dash Cancel Chart',
      SURVEY_CREATE: 'Create Survey',
      SURVEY_DELETE: 'Delete Survey',
      SURVEY_ADD_QUESTION: 'Add Survey Question',
      SURVEY_FINISH_CREATE: 'Finish Create Survey',
      SURVEY_CANCEL_CREATE: 'Cancel Create Survey',
      SURVEY_CLONE: 'Clone Survey',
      SURVEY_VIEW_RESPONSE: 'View Survey Response',



      GOAL_MET: 'Goal Met',
      GOAL_NOT_MET: 'Goal Not Met',
      GOAL_APPROVE: 'Goal Approve',
      GOAL_EDIT_START: 'Start Edit Goal',
      GOAL_EDIT_COMPLETE: 'Finish Edit Goal',
      GOAL_DELETE: 'Delete Goal',
      GOAL_SHOW_MORE: 'Goal Menu Open',
      GOAL_SHOW_WOOP: 'Show Woop',
      GOAL_START_CREATE: 'Start Goal Create',
      GOAL_CANCEL_CREATE: 'Cancel Goal Create',
      GOAL_FINISH_CREATE: 'Finish Goal Create',
      GO_TO_NOTIFICATION_LOCATION: 'Go To Not. Location',
      NOTIFICATION_OPEN_MENU: 'Open Notif. Menu',
      NOTIFICATION_DISMISS_ALL: 'Dismiss All Notifs.',
      NOTIFICATION_SETUP: 'Setup Notifications',
      NOTIFICATION_DISMISS: 'Dismiss Notification',
      NOTIFICATION_START_CREATE: 'Start Notif. Create',
      NOTIFICATION_FINISH_CREATE: 'Finish Notif. Create',
      NOTIFICATION_START_EDIT: 'Start Notif. Edit',
      NOTIFICATION_FINISH_EDIT: 'Finish Notif. Edit',
      NOTIFICATION_DELETE: 'Notif. Delete',
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
      STUDENT_SORT: 'Student Sort',
      OPEN_STUDENT: 'Go to Student',

      //Labels below here
      PIN_STUDENT_PAGE: 'Student Page',
      PIN_STUDENT_LIST: 'Student List',
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
