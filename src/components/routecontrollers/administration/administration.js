'use strict';
angular.module('teacherdashboard')
.controller('AdministrationCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$mdToast',
  function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $mdToast) {
    //Resolve the invalidated users
    api.users.get(
      { schoolId: statebag.school.id,
        enabled: false },
      function(data) {
        $scope.firstTimeUsers = data;
      });
    $scope.rgb = {
      'attendance': {
        'name':'Attendance',
        'isTemporal': true,
        'thresholdChar': '#'
      },
      'behavior': {
        'name':'Attendance',
        'isTemporal': true,
        'thresholdChar': '#'
      },
      'homework': {
        'name':'Attendance',
        'isTemporal': true,
        'thresholdChar': '%'
      },
      'gpa':{
        'name':'Attendance',
        'isTemporal': false,
        'thresholdChar': '#'
      }
    };

    $scope.saveSettingsChanges = function() {
      //TODO: AJAX call to save the settings for color thresholds and time periods
      console.log('TODO, implement save settings API call');
    };

    $scope.revertSettingsChanges = function() {
      //TODO: AJAX call to save the settings for color thresholds and time periods
      console.log('TODO, implement revert settings changes');
    };

    //Saves a single user's email address & emals them an invitation
    $scope.saveUserEmailAndSendInvite = function(user) {
      if(user && user.type && user.email) {
        api.user.put({ userId: user.id }, user, function(){
            showSimpleToast(user.username + '\'s email updated');
            api.passwordReset.initiate({ username: user.username }, null, function(){
              showSimpleToast('Emailed link to ' + user.username);
            });
        });
      }
    };

    //Triggers an email invite/password reset for all users for which we have an email address
    $scope.resendEmailInviteToAllUsersWithEmail = function() {
      $scope.firstTimeUsers.forEach(function(user){
        if(user.email && user.username) {
          api.passwordReset.initiate({ username: user.username }, null, function(){
            showSimpleToast('Emailed link to ' + user.username);
          });
        }
      });
    };

    //Shows a toast for 2 seconds with the message provided as an argument
    var showSimpleToast = function(msg) {
      $mdToast.show(
        $mdToast.simple()
          .content(msg)
          .action('OK')
          .hideDelay(2000)
      );
    };

    //Supports printing of one-time-use credentials for the eventuality where there are users without email addresses
    $scope.printCredentials = function (divName) {
      var printContents = document.getElementById(divName).innerHTML; 
      var popupWin;   
      if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
        popupWin = window.open('', '_blank', 'width=600,height=600,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
        popupWin.window.focus();
        popupWin.document.write('<!DOCTYPE html><html><head>' +
          '<link rel="stylesheet" type="text/css" href="style.css" />' +
          '</head><body onload="window.print()"><div class="reward-body">' + 
          printContents + 
          '</div></html>');
        popupWin.onbeforeunload = function () {
          popupWin.close();
          return '.\n';
        };
        popupWin.onabort = function () {
          popupWin.document.close();
          popupWin.close();
        };
      } else {
        popupWin = window.open('', '_blank', 'width=800,height=600');
        popupWin.document.open();
        popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + printContents + '</html>');
        popupWin.document.close();
      }
      popupWin.document.close();
      return true;
    };

  }]);