'use strict';
angular.module('teacherdashboard')
  .directive('gradedonut', ['$window', 'api', 'statebag', '$state', function($window, api, statebag, $state) {
    return {
      scope: {
        courseTitle: '@',
        gradeWeights: '=',
        section: '='
      },
      restrict: 'E',
      templateUrl: api.basePrefix + '/components/directives/gradedonut/gradedonut.html',
      replace: true,
      link: function(scope, elem){
          scope.element = elem;
          //In order to make tooltip borders partially transparent, we have to 
          //convert from hex to RGB because the visualization tool gives us colors as hex
          scope.hexToRgb = function(hex) {
              // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
              var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
              hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                  return r + r + g + g + b + b;
              });
              var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? 
                  'rgba(' + 
                  parseInt(result[1], 16) + ', ' + 
                  parseInt(result[2], 16) + ', ' + 
                  parseInt(result[3], 16) + ', 0.8);'
              : null;
          };

          scope.chart = $window.c3.generate({
              bindto: elem[0],
              data: {
                columns: scope.gradeWeights,
                type : 'donut',
                onclick: function() {
                  var studentAssignmentsPromise = api.studentSectionAssignments.get({ 
                    studentId: statebag.currentStudent.id,
                    schoolId: statebag.school.id, 
                    yearId: statebag.currentYear.id, 
                    termId: statebag.currentTerm.id,
                    sectionId: scope.section.id }).$promise;

                  studentAssignmentsPromise.then(
                      //Success callback
                      function(payload){
                        statebag.currentSection = scope.section;
                        statebag.currentStudentSectionAssignments = payload;
                        $state.go(
                          'app.studentSectDrill', 
                          { 
                            schoolId: statebag.school.id,
                            studentId: statebag.currentStudent.id,
                            sectionId: statebag.currentSection.id 
                          });
                      }, 
                      //Failure callback
                      function(error){
                        console.log(JSON.stringify(error));
                      });
                }
              },
              donut: {
                label: {
                  show: false
                },
                title: scope.courseTitle
              },
              legend: {
                item: {
                  onclick: function() {
                    //no op
                  }
                }
              },
              tooltip: {
                contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                  var el = d[0];
                  var prefix = '';
                  //If we're dealing with singular, prefix 'The', 
                  //otherwise, capitalize the first letter
                  if(el.id === 'midterm' || el.id === 'final') {
                    prefix = 'The ';
                  } else {
                    el.id = el.id.charAt(0).toUpperCase() + el.id.slice(1);
                  }
                  return '<div class="grade-tooltip" style="border: 1px solid ' + 
                    scope.hexToRgb(color(el)) + '">' + prefix + el.id + ' is ' + 
                    el.value + '%<br/>of the grade</div>';
                }
              }
          });
      }
    };
  }]);