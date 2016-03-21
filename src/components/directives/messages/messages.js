'use strict';
angular.module('teacherdashboard')
.directive('edpanelMessages', [ '$window', 'statebagApiManager', 'api', 'authentication', '$mdToast', '$state', 'consts', 'statebag','$compile',
  function($window, statebagApiManager, api, authentication, $mdToast, $state, consts, statebag, $compile) {
    return {
      scope: {
        messageList: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/messages/messages.html',
      replace: true,
      link: function ($scope, $elem) {
        $scope.message = {

        };
        $scope.renderMessages = function() {
          $elem.find('.messagelist-list').append($compile('<md-list-item>Under construction</md-list-item>')($scope));
        };
        $scope.newMessage = function() {
          //TODO: implement me
        };
        $scope.dismissAll = function() {
          //TODO: implement me
        };
        $scope.sendMessage = function(m) {
          if(!m.subjectUserId) {
            $mdToast.show(
              $mdToast.simple()
                .content('Group chats not yet supported :(')
                .action('OK')
                .hideDelay(1500)
            );
            return;
          }
          if(!$scope.message.body) {
            $mdToast.show(
              $mdToast.simple()
                .content('Add message text :(')
                .action('OK')
                .hideDelay(1500)
            );
            return;
          }
          var messageThread = {
            participants: [
              { participantId: m.subjectUserId },
              { participantId: authentication.identity().id }
            ]
          };
          api.messageThreads.post(
            {}, messageThread,
            function(resp){
              var message = {
                thread: { id: resp.id },
                body: $scope.message.body,
                sentBy: authentication.identity().id
              };
              api.messages.post(
                { threadId: resp.id },
                message,
                function() {
                  m.active = false;
                  $scope.message.body = '';
                  $mdToast.show(
                    $mdToast.simple()
                      .content('Message sent')
                      .action('OK')
                      .hideDelay(1500)
                  );
                });
            },
            function(){
              $mdToast.show(
                $mdToast.simple()
                  .content('Group chats not yet supported :(')
                  .action('OK')
                  .hideDelay(1500)
              );
            });
        };
      }
    };
  }]);
