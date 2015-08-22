'use strict';

angular.module('teacherdashboard')
  .controller('HomeCtrl', ['$scope', 'api', 'statebag', '$q', function ($scope, api, statebag, $q) {
  		$scope.value = {};
  		$scope.students = [
  			{ 'name' : 'Mark Roper', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 3, 'gpaClass':'70-80' },
  			{ 'name' : 'Ted Morton', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 4, 'gpaClass':'90-100' },
  			{ 'name' : 'Jordan Winch', 
  				'behavior': 90, 'behaviorClass': '90-100', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 2, 'gpaClass':'50-60' },
  			{ 'name' : 'Jarrett Man', 
  				'behavior': 65, 'behaviorClass': '60-70', 
  				'homework': 82, 'homeworkClass':'80-90', 
  				'attendance': 70, 'attendanceClass':'70-80', 
  				'gpa': 3, 'gpaClass':'70-80' },
  		];

      var context = this;
      var promises = [];
      promises.push(api.schools.get(
        {},
        //Success callback
        function(data){
            statebag.school = data[0];
        },
        //Error callback
        function(error){
            alert('failed to resolve the school!');
        }).$promise);

      promises.push(api.students.get(
        {},
        //Success callback
        function(data){
          statebag.students = data;
        },
        //Error callback
        function(error){
          alert('failed to resolve the students!');
        }).$promise);

      $q.all(promises).then(function(){
        console.log('$q.all().then() callback called!');

        statebag.students.forEach(function(student){
          var studentPromises = [];
          studentPromises.push(api.studentGpa.get({studentId: student.id}).$promise);
          //TODO: unhardcode the queryId
          var attendanceAndHwQuery = {"aggregateMeasures":
          [
            {"measure":"HW_COMPLETION","aggregation":"AVG"},
            {"measure":"ATTENDANCE","aggregation":"SUM"}
          ],
          "fields":[
            {"dimension":"STUDENT","field":"ID"}
          ],
          "filter": {
            "type":"EXPRESSION",
            "leftHandSide": { 
              "type":"EXPRESSION",
              "leftHandSide":{
                "type":"EXPRESSION",
                "leftHandSide":{
                  "value":{"dimension":"TERM","field":"ID"},
                  "type":"DIMENSION"},
                  "operator":"EQUAL",
                  "rightHandSide":{"type":"NUMERIC","value": statebag.school.terms[1].id}
                },
                "operator":"AND",
                "rightHandSide":{
                  "type":"EXPRESSION",
                  "leftHandSide":{
                    "value":{"dimension":"YEAR","field":"ID"},
                    "type":"DIMENSION"
                  },
                  "operator":"EQUAL",
                  "rightHandSide":{
                    "type":"NUMERIC",
                    "value":statebag.school.years[0].id
                  }
                }
              },
              "operator":"AND",
              "rightHandSide":{
                "type":"EXPRESSION",
                "leftHandSide":{
                  "type":"DIMENSION",
                  "value":{"dimension":"SECTION","field":"ID"}
                },
                "operator":"NOT_EQUAL",
                "rightHandSide":{"type":"NUMERIC","value":0
              }
            }
          }
        };
          studentPromises.push(api.query.results(schoolId: statebag.school.id, queryId: 1).$promise);
          $q.all(studentPromises).then(function(studentResults){
              console.log(JSON.stringify(studentResults));
          });
        });
        //Get GPA

        //Get attendance

        //homework completion

        //MOCK behavior


      });
  }]);