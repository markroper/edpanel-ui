'use strict';
angular.module('teacherdashboard')
.controller('AdministrationCtrl', ['$scope', 'api', 'statebag', '$q', '$state', 'statebagApiManager', 'authentication', 'consts', '$mdToast', '$document', '$window', 'analytics',
  function ($scope, api, statebag, $q, $state, statebagApiManager, authentication, consts, $mdToast, $document, $window, analytics) {
    $scope.$on('$viewContentLoaded', function() {
      $window.ga('send', 'pageview', { page: '/ui/schools/*/admin' });
    });

    statebag.currentPage.name = 'System Admin';
    //Resolve the invalidated users
    api.unverifiedUsers.get(
      { schoolId: statebag.school.id },
      function(data) {
        $scope.firstTimeUsers = data;
      });

    var defaultRgb = {
      'attendance': {
        'name':'Attendance',
        'isTemporal': true,
        'thresholdChar': '#'
      },
      'behavior': {
        'name':'Behavior',
        'isTemporal': true,
        'thresholdChar': '#'
      },
      'homework': {
        'name':'Homework',
        'thresholdChar': '%'
      },
      'gpa':{
        'name':'GPA',
        'isTemporal': false,
        'thresholdChar': '#'
      }
    };

    //Cache the defaults to the original state
    $scope.originalRgb = {};
    $scope.serverUiAttributes = null;
    angular.copy(defaultRgb, $scope.originalRgb);

    api.uiAttributes.get(
      { schoolId: statebag.school.id },
      function(data) {
        if(data && data.attributes && data.attributes.jsonNode) {
          statebag.uiAttributes = data;
          $scope.rgb = data.attributes.jsonNode;
          $scope.attributesId = data.id;
          angular.copy(data.attributes.jsonNode, $scope.originalRgb);
        } else {
          //use defaults
          $scope.rgb = defaultRgb;
        }
      },
      function(error) {
        console.log('No UI settings found: ' + error);
        $scope.rgb = defaultRgb;
      });

    $scope.saveSettingsChanges = function() {
      analytics.sendEvent('Administration',analytics.SAVE_CHANGES, analytics.CUSTOMIZE_LABEL);
      var updatedAttributes = {
        'school': {
          'id': statebag.school.id,
          'name': statebag.school.name
        },
        'attributes': {
          'jsonNode': $scope.rgb
        }
      };
      if($scope.attributesId) {
        updatedAttributes.id = $scope.attributesId;
        //Use PUT
        api.uiAttributes.put(
          { schoolId: statebag.school.id },
          updatedAttributes,
          function() {
            showSimpleToast('UI attributes updated');
            //repoint the originalRgb to the newly saved value
            angular.copy($scope.rgb, $scope.originalRgb);
            statebag.uiAttribuets = updatedAttributes;
          },
          function() {
            showSimpleToast('Failed to update UI attributes');
          });

      } else {
        //USE POST
        api.uiAttributes.post(
          { schoolId: statebag.school.id },
          updatedAttributes,
          function() {
            showSimpleToast('UI attributes saved');
            //repoint the originalRgb to the newly saved value
            angular.copy($scope.rgb, $scope.originalRgb);
            statebag.uiAttributes = updatedAttributes;
          },
          function() {
            showSimpleToast('Failed to save UI attributes');
          });
      }
    };

    $scope.revertSettingsChanges = function() {
      angular.copy($scope.originalRgb, $scope.rgb);
      showSimpleToast('Local changes reverted');
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
        if(user.user.email && user.user.username) {
          api.passwordReset.initiate({ username: user.user.username }, null, function(){
            showSimpleToast('Emailed link to ' + user.user.username);
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
      var printContents = $document[0].getElementById(divName).innerHTML;
      var popupWin;
      if ($window.navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
        popupWin = $window.open('', '_blank', 'width=600,height=600,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
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
        popupWin = $window.open('', '_blank', 'width=800,height=600');
        popupWin.document.open();
        popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + printContents + '</html>');
        popupWin.document.close();
      }
      popupWin.document.close();
      return true;
    };

  }]);
