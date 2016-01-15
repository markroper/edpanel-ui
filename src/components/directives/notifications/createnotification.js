'use strict';
angular.module('teacherdashboard')
.directive('createNotification', [ '$window', 'statebagApiManager', 'statebag', 'api', 'authentication', 'consts',
  function($window, statebagApiManager, statebag, api, authentication, consts) {
    return {
      scope: {
        notification: '=',
        dismissNotification: '=',
        saveNotification: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/notifications/createnotification.html',
      replace: true,
      link: function ($scope) {
        $scope.notificationDraft = {
          measure: null,
          subjects: {},
          subscribers: {},
          filters: {

          }
        };
        if(!$scope.notification.id) {
          if($scope.notification.subjects) {
            $scope.notificaiotn.subjects = {};
          }
          if($scope.notification.subscribers) {
            $scope.notification.subscribers = {};
          }
        }
        $scope.years = [];
        var currYear = $window.moment().year();
        for(var i = 0; i < 5; i++) {
          $scope.years.push(currYear + i);
        }

        //Reused constants
        var DATE_FORMATTER = 'YYYY-MM-DD';
        var SINGLE_STUDENT = 'SINGLE_STUDENT';
        var SINGLE_TEACHER = 'SINGLE_TEACHER';
        var SINGLE_ADMINISTRATOR = 'SINGLE_ADMINISTRATOR';
        var FILTERED_STUDENTS = 'FILTERED_STUDENTS';
        var SECTION_STUDENTS = 'SECTION_STUDENTS';
        var SCHOOL_TEACHERS = 'SCHOOL_TEACHERS';
        var SCHOOL_ADMINISTRATORS = 'SCHOOL_ADMINISTRATORS';
        var SECTION_ABSENCE = 'SECTION_ABSENCE';
        var SECTION_TARDY = 'SECTION_TARDY';
        var BEHAVIOR_SCORE = 'BEHAVIOR_SCORE';
        var SECTION_GRADE = 'SECTION_GRADE';
        var GPA = 'GPA';

        var ELL = 'ELL';
        var NON_ELL = 'NON_ELL';
        var SPED = 'SPED';
        var TRUE = 'TRUE';
        var FALSE = 'FALSE';
        var NON_LATINO = 'NON_LATINO';
        var NON_SPED = 'NON_SPED';
        var ALERT_ME = 'ALERT_ME';
        var SAME_AS_SUBJECTS = 'SAME_AS_SUBJECTS';
        var ALERT_PER_STUDENT = 'ALERT_PER_STUDENT';
        var ALL_SECTIONS = 'all sections';
        var percent = 'percent';
        var difference = 'difference';
        var above = 'above';
        var below = 'below';

        /**
         * Takes the scope notification and populates the draft form from it.
         */
        $scope.createDraftFromNotification = function () {
          //If there is not a pre-existing notification, we build one from scratch
          if(!$scope.notification.id) {
            return;
          }
          var d = $scope.notificationDraft;
          d.measure = $scope.notification.measure;
          //deal with section
          d.name = $scope.notification.name;
          d.triggerValue = $scope.notification.triggerValue;
          if($scope.notification.triggerWhenGreaterThan) {
            d.aboveBelow = above;
          } else {
            d.aboveBelow = below;
          }
          d.subjects.type = $scope.notification.subjects.type;
          d.subjects.student = $scope.notification.subjects.student;
          //Handle the section mapping
          if($scope.notification.subjects.section) {
            if($scope.sections.length > 1) {
              for(var i = 0; i < $scope.sections.length; i++){
                if($scope.sections[i].id === $scope.notification.subjects.section.id) {
                  d.subjects.section = $scope.sections[i];
                }
              }
            } else {
              $scope.sections.push($scope.notification.subjects.section);
              d.subjects.section = $scope.notification.subjects.section;
            }
          }
          d.subjects.teacherId = $scope.notification.subjects.teacherId;
          d.subjects.administratorId = $scope.notification.subjects.administratorId;
          d.aggregateFunction = $scope.notification.aggregateFunction;
          if(d.subjects.type === FILTERED_STUDENTS) {
            var filter = $scope.notification.subjects;
            if(filter.gender) {
              d.filters.genders = [ filter.gender ];
            }
            d.races = filter.federalRaces;
            d.ethnicities = filter.federalEthnicities;
            d.years = filter.projectedGraduationYears;
            if(filter.englishLanguageLearner === true) {
              d.ell = ELL;
            } else if(filter.englishLanguageLearner === false) {
              d.ell = NON_ELL;
            }
            if(filter.specialEducationStudent === true) {
              d.sped = SPED;
            } else if(filter.specialEducationStudent === false) {
              d.sped = NON_SPED;
            }
            d.districtEntryYears = filter.districtEntryYears;
            d.birthYears = filter.birthYears;
          }
          var n = $scope.notification;
          if(n.subscribers.type === n.subjects.type) {
            d.subscribers = SAME_AS_SUBJECTS;
          } if(n.subscribers.type === SINGLE_STUDENT){
            if(authentication.identity().id === n.subscribers.student.id) {
              d.subscribers = ALERT_ME;
            } else {
              d.subscribers = SINGLE_STUDENT;
            }
          } else if( n.subscribers.type === SINGLE_TEACHER) {
            if(authentication.identity().id === n.subscribers.teacherId) {
              d.subscribers = ALERT_ME;
            } else {
              d.subscribers = SINGLE_TEACHER;
            }
          } else if(n.subscribers.type === SINGLE_ADMINISTRATOR) {
            if(authentication.identity().id === n.subscribers.administratorId) {
              d.subscribers = ALERT_ME;
            } else {
              d.subscribers = SINGLE_ADMINISTRATOR;
            }
          } else {
            d.subscribers = n.subscribers.type;
          }
          //deal with time window
          if(n.window) {
            d.window = n.window.window;
            if(n.window.triggerIsPercent) {
              d.triggerIsPercent = percent;
            } else {
              d.triggerIsPercent = difference;
            }
          }
        };

        /**
         * Validates user input on the create notification form and returns a descriptive
         * error message if the input is invalid.  If the input is valid, null is returned;
         * @param draft
         * @returns {*}
         */
        function validateUserInputs(draft) {
          //no name
          if(!draft.name || draft.name.length > 255) {
            return 'Please create a name that is less than 255 characters';
          }
          //no measure
          if(!draft.measure) {
            return 'Please select a notification type';
          }
          if(!draft.section && (draft.measure === SECTION_GRADE ||
            draft.measure === SECTION_ABSENCE ||
            draft.measure === SECTION_TARDY)) {
            return 'The notification type requires that you select a section';

          }
          if(!draft.triggerValue) {
            return 'Please enter a trigger value';
          }
          if(!draft.subjects.type) {
            return 'Please select subjects to be measured';
          }
          if(draft.subjects.type === SECTION_STUDENTS && !draft.subjects.section) {
            return 'Please choose a section for the subject group \'students in a section\'';
          }
          if(draft.subjects.type === SINGLE_STUDENT && !draft.subjects.student) {
            return 'Please choose a student to measure';
          }
          if(!draft.subscribers.length) {
            return 'Please select who to notify';
          }

        }
        /*
          AS the user builds an alert, the following are the attribuetes bound to the scope for the draft:
          {
            name:'',
            measure: 'GPA|SECTION_GRADE|ASSIGNMENT_GRADE|BEHAVIOR_SCORE|HOMEWORK_COMPLETION|SCHOOL_ABSENCE|SCHOOL_TARDY|SECTION_ABSENCE|SECTION_TARDY',
            section: {},
            //TRIGGER RELATED
            triggerValue: 0,
            aboveBelow: 'above|below',
            //TRIGGER TIME WINDOW RELATED
            triggerOverTime: true|false,
            triggerIsPercent: percent|difference,
            window: 'DAY|WEEK|MONTH|TERM|YEAR',
            //SUBJECTS RELATED
            aggregateFunction: 'ALERT_PER_STUDENT|AVG|SUM', //only valid for non-single student subjects
            subjects: {
              type: 'SINGLE_STUDENT|SECTION_STUDENTS|FILTERED_STUDENTS',
              section: {} //only valid for section students type of subjects
            },
            filters: {
              genders: ['MALE','FEMALE'],
              races: ['BLACK', 'ASIAN', 'WHITE', 'AMERICAN_INDIAN', 'PACIFIC_ISLANDER'],
              ethnicities: ['LATINO', 'NON_LATINO'],
              years: [], //proj graduation year
              ell: ['ELL', 'NON_ELL'],
              sped: ['SPED', NON_SPED];
            },
            //SUBSCRIBERS RELATED
            subscribers: 'SAME_AS_SUBJECTS|ALERT_ME|SCHOOL_TEACHERS|SCHOOL_ADMINISTRATORS'
          }
         */
        $scope.prepareAndSave = function() {
          console.log(JSON.stringify($scope.notification));
          var draft = $scope.notificationDraft;

          //Check if the users input is valid
          $scope.errorMessage = null;
          var errorMessage = validateUserInputs(draft);
          if(errorMessage) {
            $scope.errorMessage = errorMessage;
            return;
          }
          //Input is valis, prepare & save the object!
          $scope.notification.name = draft.name;
          $scope.notification.measure = draft.measure;
          if(draft.section &&
              (draft.measure === SECTION_GRADE ||
              draft.measure === SECTION_ABSENCE ||
              draft.measure === SECTION_TARDY)) {
            if(draft.section.name != ALL_SECTIONS) {
              $scope.notification.section = { id: draft.section.id };
            }
          }
          $scope.notification.triggerValue = draft.triggerValue;
          if(draft.aboveBelow && draft.aboveBelow === above) {
            $scope.notification.triggerWhenGreaterThan = true;
          } else {
            $scope.notification.triggerWhenGreaterThan = false;
          }
          //Set up trigger window, if any
          if(draft.triggerOverTime && draft.window) {
            var isPercent = false;
            if(draft.triggerIsPercent) {
              isPercent = true;
            }
            var window = {
              triggerIsPercent: isPercent,
              window: draft.window
            };
            $scope.notification.window = window;
          }

          //SUBJECTS
          if(!$scope.notification.subjects) {
            $scope.notification.subjects = {};
          }
          $scope.notification.subjects.type = draft.subjects.type;
          if(draft.subjects.type === SECTION_STUDENTS) {
            if(draft.subjects.section && draft.subjects.section.id) {
              var sec = {
                id: draft.subjects.section.id
              };
              $scope.notification.subjects.section = sec;
            }

          } else if(draft.subjects.type === SINGLE_STUDENT) {
            $scope.notification.subjects.student = draft.subjects.student;
          } else if(draft.subjects.type === FILTERED_STUDENTS && draft.filters) {
            if(draft.filters.genders & draft.filters.genders.length === 1 ) {
              $scope.notification.subjects.gender = draft.filters.genders[0];
            }
            if(draft.filters.races) {
              $scope.notification.subjects.federalRaces = draft.filters.races;
            }
            if(draft.filters.ethnicities && draft.filters.enthnicities.length === 1) {
              var value = TRUE;
                if(draft.filters.ethnicities[0] === NON_LATINO) {
                  value = FALSE;
                }
              $scope.notification.subjects.federalEthnicities = [ value ];
            }
            if(draft.filters.years) {
              $scope.notification.subjects.projectedGraduationYears = draft.filters.years;
            }
            if(draft.filters.ell && draft.filters.ell.length === 1) {
              var value = true;
              if(draft.filters.ell === NON_ELL) {
                value = false;
              }
              $scope.notification.subjects.englishLanguageLearner = value;
            }
            if(draft.filters.sped && draft.filters.sped.length === 1) {
              var value = true;
              if(draft.filters.sped === NON_SPED) {
                value = false;
              }
              $scope.notification.subjects.specialEducationStudent = value;
            }
          }
          //Set the aggregate function if we're dealing with non-single student
          if(draft.subjects.type !== SINGLE_STUDENT && draft.aggregateFunction) {
            if (draft.aggregateFunction !== ALERT_PER_STUDENT) {
              $scope.notification.aggregateFunction = draft.aggregateFunction;
            } else {
              $scope.notification.aggregateFunction = null;
            }
          } else {
            $scope.notification.aggregateFunction = null;
          }

          //SUBSCRIBERS
          if(draft.subscribers === SAME_AS_SUBJECTS) {
            var subscribers = angular.copy($scope.notification.subjects);
            subscribers.id = null;
            $scope.notification.subscribers = subscribers;
          } else if(draft.subscribers === ALERT_ME) {
            var type = null;
            var userId = authentication.identity().id;
            var subscribers = {};
            if(statebag.userRole === 'Student') {
              subscribers.type = SINGLE_STUDENT;
              subscribers.student = { id: userId };
            } else if(statebag.userRole === 'Teacher') {
              subscribers.type = SINGLE_TEACHER;
              subscribers.teacherId = userId;
            } else if(statebag.userRole === 'Administrator' || statebag.userRole === 'Admin') {
              subscribers.type = SINGLE_ADMINISTRATOR;
              subscribers.administratorId = userId;
            }
            //TODO: error out if there is not supported user type
            if(subscribers.type) {
              $scope.notification.subscribers = subscribers;
            }

          } else if(draft.subscribers === SCHOOL_TEACHERS || draft.subscribers === SCHOOL_ADMINISTRATORS) {
            if($scope.notification.subscribers.type !== draft.subscribers) {
              $scope.notification.subscribers = { type: draft.subscribers };
            }
          }
          if(!$scope.notification.schoolId){
            $scope.notification.schoolId = statebag.school.id;
          }
          if(!$scope.notification.expiryDate) {
            $scope.notification.expiryDate = $window.moment().add(6, 'M').format(DATE_FORMATTER);
          }
          if(!$scope.notification.createdDate) {
            $scope.notification.createdDate = $window.moment().format(DATE_FORMATTER);
          }
          if(!$scope.notification.owner) {
              $scope.notification.owner = { id: authentication.identity().id };
              if(statebag.userRole === 'Student') {
                $scope.notification.owner.type = consts.roles.STUDENT;
              } else if(statebag.userRole === 'Teacher') {
                $scope.notification.owner.type = consts.roles.TEACHER;
              } else if(statebag.userRole === 'Administrator' || statebag.userRole === 'Admin') {
                $scope.notification.owner.type = consts.roles.ADMIN;
              }
          }
          $scope.saveNotification();
        };

        /*
         * Student list filter related
         */
        function createFilterFor(query) {
          var lowercaseQuery = angular.lowercase(query);
          return function filterFn(student) {
            return (angular.lowercase(student.name).indexOf(lowercaseQuery) === 0);
          };
        }
        $scope.querySearch = function(query) {
          var results = query ? statebag.students.filter( createFilterFor(query) ) : statebag.students;
          return results;
        };
        $scope.searchTextChange = function(text) {
        };

        $scope.selectedItemChange = function(item) {
        };

        //The stuff that is called on load:
        $scope.sections = [ {name: ALL_SECTIONS } ];
        if(!statebag.currentSections || statebag.currentSections.length === 0) {
          api.sections.get({
              schoolId: statebag.school.id,
              yearId: statebag.currentYear.id,
              termId: statebag.currentTerm.id
            },
            function(resp) {
              statebag.currentSections = resp;
              $scope.sections = resp;
              $scope.sections.unshift({ name: ALL_SECTIONS });
              $scope.createDraftFromNotification();
            },
            function() {
              $scope.createDraftFromNotification();
              console.log('Unable to resolve sections');
            })
        } else {
          $scope.sections = statebag.currentSections;
          $scope.createDraftFromNotification();
        }
      }
    }
  }]);
