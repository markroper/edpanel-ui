'use strict';
angular.module('teacherdashboard')
  .directive('creategoal', ['$state', 'statebag', 'api','$q', '$mdToast', '$mdDialog', '$document','$timeout','$window','statebagApiManager',
    function($state, statebag, api, $q, mdToast, $mdDialog, $document, $timeout,$window, statebagApiManager) {
      return {
        scope: {
          sections: '=',
          pendingGoals: '='
        },
        restrict: 'E',
        templateUrl: api.basePrefix + '/components/directives/creategoal/creategoal.html',
        replace: true,
        controller: function ($scope) {
          $scope.createGoal = false;
          $scope.goal = {};
          $scope.goalTypes = [
            {"uiName":"Behavior"},
            {"uiName":"Class Grade"},
            {"uiName":"Assignment"},
            {"uiName":"Other"}];

          $scope.behaviorCategories = [
            {
              'uiName':'Merit',
              'apiName':'MERIT'
            },
            {
              'uiName':'Demerit',
              'apiName':'DEMERIT'
            },
            {
              'uiName':'Detention',
              'apiName':'DETENTION'
            },
            {
              'uiName':'Out of School Suspension',
              'apiName':'OUT_OF_SCHOOL_SUSPENSION'
            },
            {
              'uiName':'In School Suspension',
              'apiName':'IN_SCHOOL_SUSPENSION'
            },
            {
              'uiName':'Referral',
              'apiName':'REFERRAL'
            }
          ];
          var uiNamesToApi = {
            "Behavior":"BEHAVIOR",
            "Class Grade":"SECTION_GRADE",
            "Assignment":"ASSIGNMENT",
            'Merit':'MERIT',
            'Demerit':'DEMERIT',
            'Detention':'DETENTION',
            'Out of School Suspension':'OUT_OF_SCHOOL_SUSPENSION',
            'In School Suspension': 'IN_SCHOOL_SUSPENSION',
            'Referral':'REFERRAL'
          };
          var showSimpleToast = function(msg) {
            mdToast.show(
              mdToast.simple()
                .content(msg)
                .action('OK')
                .hideDelay(2000)
            );
          };

          $scope.openCreateGoal = function() {
            $scope.createGoal = true;
          };

          $scope.submitCreateGoal = function() {
            $scope.createGoal = false;
            console.log($scope.goal.class);
            var goalToMake = {
              'goalType':uiNamesToApi[$scope.goal.createType],
              'staff':statebag.currentStudent.student.advisor,
              'desiredValue':$scope.goal.desiredGrade,
              'obstacles':$scope.goal.obstacle,
              'plan':$scope.goal.plan,
              'outcome':$scope.goal.outcome,
              'student':statebag.currentStudent.student,
              'approved':false,
              'teacherFollowup':false,
              //TODO this should be a school setting
              'autocomplete':false
              //ONLY IF ITS NECESSARY

            };
            if ($scope.goal.createType === 'Assignment') {
              goalToMake['name'] = $scope.goal.assignment + " Goal";
              goalToMake['section'] = {id:$scope.goal.class};
            } else if ($scope.goal.createType === 'Behavior') {
              var today = new Date();
              goalToMake['name'] = $scope.goal.behaviorCat + " Goal";
              goalToMake['behaviorCategory'] = uiNamesToApi[$scope.goal.behaviorCat];
              goalToMake['startDate'] = today.getFullYear() + '-' +today.getMonth()+1 +'-'+today.getDate();
            } else if ($scope.goal.createType === 'Class Grade') {
              console.log("HERE");
              console.log($scope.goal.class.name);
              goalToMake['name'] = $scope.goal.class.name + " Grade Goal";
              var sectionName;
              console.log($scope.goal.class);

              for (var i = 0; i < $scope.sections.length; i ++) {
                if ($scope.sections[i].id == $scope.goal.class) {
                  sectionName = $scope.sections[i].course.name;
                }
              }
              goalToMake['name'] = sectionName + " Grade Goal";
              goalToMake['section'] = {
                id:$scope.goal.class,
                course:{
                  name:sectionName
                }
              };
            }
            api.studentGoals.post(
              { studentId: statebag.currentStudent.id},
              goalToMake,
              function(results) {
                console.log(results);
                goalToMake['id'] = results.id;
                showSimpleToast('Goal created successfully');
                $scope.pendingGoals.push(goalToMake);
              },
              function() {
                showSimpleToast('There was a problem creating the goal');

              });
            //Actually submit goal here
          };

        }


      }
    }]);
