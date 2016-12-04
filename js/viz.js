// FIREBASE INIT

var chart;

var width = 700; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 400; // THIS TOO.

var boxSize = 5;
var boxSpacing = 1;
var boxSpaceMultipler = boxSize + boxSpacing

var xSpacing = 75;
var ySpacing = 350;

var map;
var service;
var currentStationCentered = 0;

var bikeIDForTesting = 23458;
var allStations;
var allPOIs;


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

updateViz('time');
// initMap();

//Called when the update button is clicked
function updateViz(sortType) {
    getRidesForBike(23457).then(function(dataset) {

      // console.log(dataset)
        console.log('getting rides')

        var ridesByAge = sortDataBy(sortType, dataset)

        // Get width of div
        var element = document.getElementsByClassName('main');
        console.log(element[0].clientWidth)

        var axisBoxWidth = (10 * boxSize) + (9 * boxSpacing)
        var totalAxisWidth = (axisBoxWidth*6) + (boxSpacing*4)

        xSpacing = (element[0].clientWidth - totalAxisWidth)/2

        // AXIS DEFINITION
        vis.append('g')
            .selectAll('body')
            .data([0,1,2,3,4,5])
            .enter()
            .append('rect')
            .attr('x', function(d,i) {
               return (xSpacing-1)+((i+1)*boxSpacing)+(i*axisBoxWidth)
            })
            .attr('y', ySpacing+8)
            .attr('height', 15)
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
               return ((xSpacing-2)+((i+1)*boxSpacing)+(i*axisBoxWidth))+10
            })
            .attr('y', ySpacing + 20)
            .attr('height', 25)
            .attr('width', axisBoxWidth)
            .style('fill', 'white')
            .style('font-size', '14px')

      // console.log(ridesByAge)

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
               //   console.log(d)
               //   console.log(j)
                return ySpacing - (j*boxSpaceMultipler);
              })
              .attr('height', boxSize) // circle -> r -> boxSize/2
              .attr('width', boxSize)
              .attr("class", function(d, i) {
                  return "rect" + d.age
              })
              .style("fill", function(d) {
                if (sortType == 'type') {
                  if (d.userType == 'Customer') {
                      return "cyan";
                  } else {
                      return "purple";
                  }
               } else {
                if (d.gender == 1) {
                  //  console.log('male')
                    return "#7E8A96";
                } else {
                    return "#C47856";
                }
             }

              });


           }
     }
     initMap();
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


/* Notes
Page Loads
Get Birth Station
Get Four Popular Stations
Get POI for each Station
Get Images for each POI
*/

function initMap() {
   console.log('foo')
    // Assumes Birth Station is listed first
   //  var innerDiv = document.createElement('div');
   // innerDiv.className = 'mapBoxMap';
   //  document.getElementsByTagName('body')[0].appendChild(innerDiv);

    var allStations = new Array();
    var allPOIs = new Array();

    var stationObjects = demoSetupCode();

    // Create neccessary HTML objects - SW
    var rightDiv = document.getElementsByClassName('right');
    var mapBoxMapDiv = document.createElement('div');
    mapBoxMapDiv.id = 'mapBoxMap';
    rightDiv[0].appendChild(mapBoxMapDiv);

    var bottomLeftDiv = document.getElementsByClassName('bottom');
    var flyButtonObject = document.createElement('button');
    flyButtonObject.id = 'flyButton';
    var btnText = document.createTextNode('Move to Next Station');
    flyButtonObject.appendChild(btnText);
    bottomLeftDiv[0].appendChild(flyButtonObject);

    // Initialize the MapBox Map
    // Center on the middle of New York
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2VlZm9zdGVyIiwiYSI6ImJJdjN1V1UifQ.7unwlg_mgObhfSto2HqA-w';
    var map = new mapboxgl.Map({
        container: 'mapBoxMap',
        center: [-73.985130, 40.758896],
        zoom: 14,
        style: 'mapbox://styles/ceefoster/civshbtsd00052jqixmnpt9n6'
    });


    //Get Birth Station
    getBirthStationForBike(bikeIDForTesting).then(function(birthStationID) {

      getStationForID(birthStationID).then(function(stationData) {
          allStations.push(stationData);
          //console.log("Station Data" + JSON.stringify(stationData));
          //console.log("getting the station latitude " + stationData.latitude)
          //for each station, step through and grab a POI near it from Foursquare

          //TODO getPOIForStation(stationData);

          //getStationForID(3230).then(function(stationReturned) {
          //    console.log("returned Object" + JSON.stringify(stationReturned));
          //    stations.push(stationReturned);
          //});

          getPopularStationIDsForBike(bikeIDForTesting).then(function(stationsList) {
              console.log("popular station IDs - " + stationsList);

              for (var i = 0; i < stationsList.length; i++) {

                  if (i == (stationsList.length - 1)) {
                    getStationForID(stationsList[i]).then(function(theStation) {
                        allStations.push(theStation);

                        console.log("all da stations" + JSON.stringify(allStations));

                        map.addSource("markers", {
                            "type": "geojson",
                            "data": getMarkers(allStations)
                        });

                        map.addLayer({
                            "id": "markers",
                            "type": "symbol",
                            "source": "markers",
                            "layout": {
                                "icon-image": "{marker-symbol}-15",
                                "text-field": "{title}",
                                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                                "text-offset": [0, 0.6],
                                "text-anchor": "top"
                            }
                        });

                        // Find Streetview Images for a Lat & Long Pair
                        findImageForCoords(allStations[0].latitude, allStations[0].longitude);

                    });

                  } else {

                    getStationForID(stationsList[i]).then(function(theStation) {
                        allStations.push(theStation);
                    });

                  }


              }




          });

      });
    });


    //Code for the Fly Button
    document.getElementById('flyButton').addEventListener('click', function () {

        currentStationCentered = currentStationCentered + 1;

        map.flyTo({
            speed: 0.4, // make the flying slow
            curve: 1, // change the speed at which it zooms out
            center: [
                allStations[currentStationCentered].longitude,
                allStations[currentStationCentered].latitude]
        });

        findImageForCoords(allStations[currentStationCentered].latitude, allStations[currentStationCentered].longitude);

    });

}

function demoSetupCode () {

    var station1Example = '{"details":{"latitude":"40.74854862","longitude":"-73.98808416","name":"Broadway & W 32 St","stationNumber":"498"}}';

    var station2Example = '{"details":{"latitude":"40.7390169121","longitude":"-74.0026376103","name":"Greenwich Ave & 8 Ave","stationNumber":"284"}}';

    var station3Example = '{"details":{"latitude":"40.6845683","longitude":"-73.95881081","name":"Monroe St & Classon Ave","stationNumber":"289"}}';

    var station4Example = '{"details":{"latitude":"40.72953837","longitude":"-73.98426726","name":"E 11 St & 1 Ave","stationNumber":"326"}}';

    var station5Example = '{"details":{"latitude":"40.7047177","longitude":"-74.00926027","name":"Pearl St & Hanover Square","stationNumber":"415"}}';

    var s1parsed = JSON.parse(station1Example);
    var s2parsed = JSON.parse(station2Example);
    var s3parsed = JSON.parse(station3Example);
    var s4parsed = JSON.parse(station4Example);
    var s5parsed = JSON.parse(station5Example);

    //Combine into an array.
    var stationObjectsArray = [s1parsed, s2parsed, s3parsed, s4parsed, s5parsed];

    return stationObjectsArray

}


function getBirthStationForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var birthStation = "";
    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().limitToFirst(1).once("value").then(function(snapshot) {

      snapshot.forEach(function(childSnapshot) {

        var dataObject = childSnapshot.val();
        console.log("see this -" + dataObject.startStation);

        if (birthStation == "") {
          birthStation = dataObject.startStation;
        }

      });

    }).then(function() {
        return birthStation;
    });
};


function getStationForID(stationID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stationObject = new Object();
    return ref.child('stations/' + stationID + '/details/').orderByKey().once("value").then(function(snapshot) {

            var latitude = snapshot.val();
            console.log("hey - " + JSON.stringify(latitude));

            var dataObject = snapshot.val()

            if (dataObject.latitude) {
              stationObject = dataObject;
            }

    }).then(function() {
        return stationObject;
    });
};



function getPopularStationIDsForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stations = new Array();
    return ref.child('bikes/' + bikeID + '/stations/').orderByValue().limitToFirst(4).once("value").then(function(snapshot) {

      snapshot.forEach(function(childSnapshot) {

        var dataObject = childSnapshot.val();
        console.log("see this - " + childSnapshot.key);
        stations.push(childSnapshot.key);

      });

    }).then(function() {
        return stations;
    });
};


function getPOIForStation(station) {

  console.log("station object for POI - " + JSON.stringify(station));
  var latitude = station.latitude;
  var longitude = station.longitude;
  console.log("the latitude " + latitude);
  console.log("the lng " + longitude);

  var fullURL = "https://api.foursquare.com/v2/venues/search?client_id=WGL01RK4VNICIVWY2R2HLI2QW0OWUCF0JFKB0TM1G4N1IF1K&client_secret=JP35VVFSRCL034AA45Y5VTZ55YGH510ZHXEIM5XKCMI5IW4H&v=20130815&ll=" + latitude + "," + longitude + "&radius=400&intent=browse";
  console.log("theURL is " + fullURL);

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          //console.log(xmlHttp.responseText);
          var results = JSON.parse(xmlHttp.responseText);
          var allVenues = results.response.venues;
          var highestCheckinVenueIndex = 0;
          var bestCheckinValue = 0;

          for (var i = 0; i < allVenues.length; i++) {
            var checkinsCount = allVenues[i].stats.checkinsCount;
            if (checkinsCount > bestCheckinValue) {
              bestCheckinValue = checkinsCount;
              highestCheckinVenueIndex = i;
            }
          }

          var latitude = allVenues[highestCheckinVenueIndex].location.lat;
          var longitude = allVenues[highestCheckinVenueIndex].location.lng;

          console.log("the highest value " + bestCheckinValue + "with index " + highestCheckinVenueIndex + "with lat and lng" + latitude + longitude);

          allPOIs.push(allVenues[highestCheckinVenueIndex]);

          //console.log(allPlaces);
          //console.log("tipcount" + allPlaces.response.venues[1].stats.checkinsCount);
        }
  }
  xmlHttp.open("GET", fullURL, true); // true for asynchronous
  xmlHttp.send(null);

}




function getMarkers(theStations) {

   console.log("check all this " + theStations);
   console.log("check all this " + JSON.stringify(theStations));

    var station1Lat = parseFloat(theStations[0].latitude);
    var station1Lng = parseFloat(theStations[0].longitude);

    var station2Lat = parseFloat(theStations[1].latitude);
    var station2Lng = parseFloat(theStations[1].longitude);

    var station3Lat = parseFloat(theStations[2].latitude);
    var station3Lng = parseFloat(theStations[2].longitude);

    var station4Lat = parseFloat(theStations[3].latitude);
    var station4Lng = parseFloat(theStations[3].longitude);

    var station5Lat = parseFloat(theStations[4].latitude);
    var station5Lng = parseFloat(theStations[4].longitude);



    var thisTest = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station1Lng, station1Lat]
                    },
                    "properties": {
                        "title": theStations[0].name,
                        "marker-symbol": "star"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station2Lng, station2Lat]
                    },
                    "properties": {
                        "title": theStations[1].name,
                        "marker-symbol": "bicycle"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station3Lng, station3Lat]
                    },
                    "properties": {
                        "title": theStations[2].name,
                        "marker-symbol": "bicycle"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station4Lng, station4Lat]
                    },
                    "properties": {
                        "title": theStations[3].name,
                        "marker-symbol": "bicycle"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station5Lng, station5Lat]
                    },
                    "properties": {
                        "title": theStations[4].name,
                        "marker-symbol": "bicycle"
                    }
                }]
            };

    return thisTest;

}




function demoSetupCode () {

    var station1Example = '{"details":{"latitude":"40.74854862","longitude":"-73.98808416","name":"Broadway & W 32 St","stationNumber":"498"}}';

    var station2Example = '{"details":{"latitude":"40.7390169121","longitude":"-74.0026376103","name":"Greenwich Ave & 8 Ave","stationNumber":"284"}}';

    var station3Example = '{"details":{"latitude":"40.6845683","longitude":"-73.95881081","name":"Monroe St & Classon Ave","stationNumber":"289"}}';

    var station4Example = '{"details":{"latitude":"40.72953837","longitude":"-73.98426726","name":"E 11 St & 1 Ave","stationNumber":"326"}}';

    var station5Example = '{"details":{"latitude":"40.7047177","longitude":"-74.00926027","name":"Pearl St & Hanover Square","stationNumber":"415"}}';

    var s1parsed = JSON.parse(station1Example);
    var s2parsed = JSON.parse(station2Example);
    var s3parsed = JSON.parse(station3Example);
    var s4parsed = JSON.parse(station4Example);
    var s5parsed = JSON.parse(station5Example);

    //Combine into an array.
    var stationObjectsArray = [s1parsed, s2parsed, s3parsed, s4parsed, s5parsed];

    return stationObjectsArray

}

function findPOINear(station) {

    // Create google maps location object
    var stationLocation = new google.maps.LatLng(station.latitude, station.longitude);

    // Create & initialize Google Map with Existing HTML Element "map"
    map = new google.maps.Map(document.getElementById("map"), {
        center: stationLocation,
        zoom: 15
    });

    // Specify parameters for the Places Search - location, radius, type.
    // supported types - https://developers.google.com/places/supported_types
    var request = {
        location: stationLocation,
        radius: '500',
        types: ['park']
    };

    // Perform Places Search & run callback on completion
   //  service = new google.maps.places.PlacesService(map);
   //  service.nearbySearch(request, foundStationPOIs);

}

function findImageForCoords(latitude, longitude) {

    var img = document.createElement("img");
    img.className = 'theStationImage'
    img.src = "https://maps.googleapis.com/maps/api/streetview?size=640x180&location=" + latitude + "," + longitude + "&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo";
    img.width = 500;
    img.height = 200;

    // This next line will just add it to the <body> tag
   //  var visDiv = document.getElementById('vis');
   //  var buttonDiv = document.getElementById('flyButton');
   var imageDiv = document.getElementsByClassName('middle');
    imageDiv[0].append(img);

}
