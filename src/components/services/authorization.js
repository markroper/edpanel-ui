'use strict';
angular.module('teacherdashboard')
//Allow or disallow access to a UI route according to authentication & role status
.factory('authorization', ['$rootScope', '$state', 'authentication', 'api', 'statebag',
  function($rootScope, $state, authentication, api, statebag) {
    return {
      authorize: function(event) {
        var context = this;
        var isAuthenticated = authentication.isAuthenticated();
        //Is the endpoint role limited?
        if ($rootScope.toState.data.roles && $rootScope.toState.data.roles.length > 0) {
          //Ok, there are roles on this endpoint, if the user is not authenticated
          //from the client perspective, make a call to the server to double check.
          if(!isAuthenticated) {
            this.serverCookieAuthUpdate().then(
              function(){
                context.passthroughOrRedirect(event, true);
              },
              function(){
                context.passthroughOrRedirect(event);
              });
          } else {
            context.passthroughOrRedirect(event);
          }
        }
      },
      passthroughOrRedirect: function(event, fullRefresh) {
        var isAuthenticated = authentication.isAuthenticated();
        //Having checked with the server, do a role check.  if the user can't
          //access the page show an access denied if they're logged in, and redirect
          //to the login page if they're not
          if(!authentication.isInAnyRole($rootScope.toState.data.roles)) {
            //Prevent the previous event from redirecting the URL
            event.preventDefault();
            if (isAuthenticated) {
              $state.go('accessdenied');
            } else {
              // user is not authenticated. stow the state they wanted before you
              // send them to the signin state, so you can return them when you're done
              $rootScope.returnToState = $rootScope.toState;
              $rootScope.returnToStateParams = $rootScope.toStateParams;
              // now, send them to the signin state so they can log in
              $state.go('login');
            }
          }
          //When a user clicks a link or does a full page refresh we need to force
          //a route reload after we've resolved the user to get everything in a consistent state.
          //This is because our angular material themes which control colors and some other
          //global state display are not scope variable bound and don't get updated :(
          if(fullRefresh) {
            $state.go($state.current, {}, {reload: true});
          }
      },
      //If the user is not authenticated, call to the server for a cookie check
      //The user may be logged in but clicking a link or refreshing the browser
      //In these cases, JS can't access teh valid cookie we need to ask the server
      //to interrogate the cookie for us and hand back a user, if there is a valid cookie
      serverCookieAuthUpdate: function() {
        return api.authCheck.get(
          {},
          function(data){
            statebag.userRole = data.type.charAt(0) + data.type.toLowerCase().slice(1);
            statebag.theme = statebag.resolveTheme(data.type);
            var identity = {
              username: data.username,
              name: data.name,
              id: data.id,
              roles: [ data.type ],
              schoolId: data.currentSchoolId
            };
          authentication.authenticate(identity);
          },
          function(error){
            console.log('we are not authenticated ' + JSON.stringify(error));
          }).$promise;
      }
    };
  }
]);
