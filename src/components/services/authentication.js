'use strict';
angular.module('teacherdashboard').factory('authentication', [function() {
    var _identity,
      _authenticated = false,
      _roles = Object.freeze(['ROLE_ADMIN', 'ROLE_TEACHER', 'ROLE_STUDENT', 'ROLE_GUARDIAN', 'ROLE_SUDO']);

    return {
      getRoles: function() {
        return _roles;
      },
      isIdentityResolved: function() {
        return angular.isDefined(_identity);
      },
      isAuthenticated: function() {
        return _authenticated;
      },
      isInRole: function(role) {
        if (!_authenticated || !_identity.roles) {
          return false;
        }
        return _identity.roles.indexOf(role) !== -1;
      },
      isInAnyRole: function(roles) {
        if (!_authenticated || !_identity.roles) {
          return false;
        }
        for (var i = 0; i < roles.length; i++) {
          if (this.isInRole(roles[i])) {
            return true;
          }
        }
        return false;
      },
      authenticate: function(identity) {
        _identity = identity;
        _authenticated = identity !== null;
      },
      identity: function() {
        return _identity;
      }
    };
  }
]);