// FIREBASE INIT

var chart;

var width = 1400;
var height = 650;

var boxSize = 10;
var boxSpacing = 2;
var boxSpaceMultipler = boxSize + boxSpacing

var xSpacing = 100;
var ySpacing = 300;

//DEFINE YOUR VARIABLES UP HERE
console.log('in')

//Gets called when the page is loaded.
function init() {
    chart = d3.select('#vis').append('svg')
      .attr("width", width)
      .attr("height", height);
    vis = chart.append('g');
    //PUT YOUR INIT CODE BELOW
}

updateViz('gender');

//Called when the update button is clicked
function updateViz(sortType) {
    getRidesForBike(23458).then(function(dataset) {
      console.log(dataset)
        console.log('getting rides')

        var ridesByAge = sortDataBy(sortType, dataset)

        var axisBoxWidth = (10 * boxSize) + (9 * boxSpacing)

        // AXIS DEFINITION
        vis.append('g')
            .selectAll('body')
            .data([0,1,2,3,4,5])
            .enter()
            .append('rect')
            .attr('x', function(d,i) {
               return (xSpacing-2)+((i+1)*boxSpacing)+(i*axisBoxWidth)
            })
            .attr('y', 315)
            .attr('height', 25)
            .attr('width', axisBoxWidth)
            .style('fill', 'black')

         vis.append('g')
            .selectAll('body')
            .data(['16-25', '26-35', '36-45', '46-55', '56-65', '66-75'])
            .enter()
            .append('text')
            .text(function(d) {
               return d;
            })
            .attr('x', function(d,i) {
               return ((xSpacing-2)+((i+1)*boxSpacing)+(i*axisBoxWidth))+43
            })
            .attr('y', 332)
            .attr('height', 25)
            .attr('width', axisBoxWidth)
            .style('fill', 'white')
            // .attr("transform", "translate(" + width/2 + ")")

      //   d3.select("body").selectAll("p")
      //       .data(ridesByAge)
      //       .enter()
      //       .append("p")
      //       .sort(function(a, b) {
      //           return d3.ascending(a.key, b.key);
      //       })
      //       .text(function(d) {
      //          //  return d.values.forEach(function(ageRide) {
      //             //   console.log(ageRide.rideID)
      //          //      return ageRide.rideID;
      //          //  });
      //          // console.log(d.values[0])
      //          if (d.values[0] == 'undefined') {
      //              var maleCount = 0
      //          } else {
      //             var maleCount = d.values[0].value
      //          }
        //
      //          if (d.values[1] == 'undefined') {
      //              var femaleCount = 0
      //          } else {
      //             var femaleCount = d.values[0].value
      //          }
        //
      //          return 'male: ' + maleCount + '; female: ' + femaleCount
      //          // return d.values.nodes.rideID
      //       })


      // d3.select("body").selectAll("p")
      //  .data(ridesByAge)
      //  .enter()
      //  .append("p")
      //  .sort(function(a, b) {
      //           return d3.ascending(a.age, b.age);
      //   })
      //  .text(function(d) {
      //     var thingsToSay = "Ride " + d.rideID + " was taken on bike " + d.bikeID + " from Station " + d.stationID + ". The rider was " + d.age + " years old, gender " + d.gender + ", and a " + d.userType + "."
      //     return thingsToSay;
      //  })
      //  .style("color", function(d) {
      //     if (d.gender == 1) {   //Threshold of 15
      //         return "blue";
      //     } else {
      //         return "red";
      //     }
      // });
      console.log(ridesByAge)
      // i = 18

      for (i = 16-16; i <= 75-16; i++) {
         var svg = d3.select('svg');

         if (ridesByAge[i] !== undefined) {
            // console.log(ridesByAge[i-16].values)

            // svg.selectAll('body')
           // Gender Dist
           vis.append('g')
              .selectAll('body')
              .data(ridesByAge[i].values)
              .enter()
              .append('rect')
              .attr('x', ((i+1)*boxSpaceMultipler) + xSpacing) // circle -> cx
              .attr('y', function(d, j) { // circle -> cy
                 console.log(d)
                 console.log(j)
                return ySpacing - (j*boxSpaceMultipler);
              })
              .attr('height', boxSize) // circle -> r -> boxSize/2
              .attr('width', boxSize)
              .attr("class", function(d, i) {
                  return "rect" + d.age
              })
              .style("fill", function(d) {
                if (sortType == 'type') {
                  if (d.userType == 'Customer') {   //Threshold of 15
                      return "cyan";
                  } else {
                      return "purple";
                  }
               } else {
                if (d.gender == 1) {   //Threshold of 15
                   console.log('male')
                    return "blue";
                } else {
                    return "red";
                }
             }

              });


           }
     }
    });
};

//Callback for when data is loaded
function update(rawdata) {
    //PUT YOUR UPDATE CODE BELOW


}

function byGender() {
   updateViz('gender');
}

function byType() {
   updateViz('type');
}

function byTime() {
   updateViz('time');
}

function getRidesForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var fullDataArray = new Array();
    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var dataObject = childSnapshot.val()

            var theRefactoredObject = {
                'rideID': childSnapshot.key,
                'bikeID': bikeID,
                'stationID': dataObject.startStation,
                'gender': dataObject.user.gender,
                'userType': dataObject.user.type,
                'age': 2016 - Number(dataObject.user.birthYear)
            }

            fullDataArray.push(theRefactoredObject);
        });
    }).then(function() {
        return fullDataArray
    });
};

function sortDataBy(sortType, dataset) {
   var ridesByAge = d3.nest()
       .key(function(d) {
           return d.age;
       })
       .entries(dataset);

   ridesByAge = ridesByAge.sort(function(a, b) {
      return d3.ascending(a.key, b.key);
   })

   for (i = 0; i <= ridesByAge.length; i++) {
      if (ridesByAge[i] !== undefined) {
         if (sortType == 'type') {
            ridesByAge[i].values = ridesByAge[i].values.sort(function(a, b) {
               return d3.ascending(a.userType, b.userType);
            });
         } else if (sortType == 'time') {
            return ridesByAge
         } else {
            ridesByAge[i].values = ridesByAge[i].values.sort(function(a, b) {
               return d3.ascending(a.gender, b.gender);
            });
         }
      }
   }

   return ridesByAge
}
