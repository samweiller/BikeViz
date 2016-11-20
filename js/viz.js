// FIREBASE INIT

var chart;

var width = 500; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 400; // THIS TOO.

var boxSize = 4;
var boxSpacing = 2;
var boxSpaceMultipler = boxSize + boxSpacing

var xSpacing = 50;
var ySpacing = 200;

var map;
var service;
var currentStationCentered = 0;


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
// initMap();

//Called when the update button is clicked
function updateViz(sortType) {
    getRidesForBike(23458).then(function(dataset) {

      // console.log(dataset)
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
                    return "blue";
                } else {
                    return "red";
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


function initMap() {
   console.log('foo')
    // Assumes Birth Station is listed first
   //  var innerDiv = document.createElement('div');
   // innerDiv.className = 'mapBoxMap';
   //  document.getElementsByTagName('body')[0].appendChild(innerDiv);


    var stationObjects = demoSetupCode();

    // Create neccessary HTML objects - SW
    var visDiv = document.getElementById('vis');
    var mapBoxMapDiv = document.createElement('div');
    mapBoxMapDiv.id = 'mapBoxMap';
    visDiv.appendChild(mapBoxMapDiv);

    var flyButtonObject = document.createElement('button');
    flyButtonObject.id = 'flyButton';
    var btnText = document.createTextNode('Move to Next Station');
    flyButtonObject.appendChild(btnText);
    visDiv.appendChild(flyButtonObject);

   //  console.log(stationObjects)
    // Initialize the MapBox Map
    // Center on the First Station
    mapboxgl.accessToken = 'pk.eyJ1IjoidTJwcmlkZSIsImEiOiJjaXVxdzQwZXgwMDJtMnlsZmhiZ210bXAxIn0.sagkmIswAS2ter40NW0DBA';
    var map = new mapboxgl.Map({
        container: 'mapBoxMap',
        center: [stationObjects[0].details.longitude, stationObjects[0].details.latitude],
        zoom: 14,
        style: 'mapbox://styles/mapbox/light-v9'
    });


    // Get the Formatted GeoJSON from our Station Data
    var geoJSON = getMarkers(stationObjects);


    // Once the map loads, add the Markers from the GeoJSON File
    map.on('style.load', function () {

        map.addSource("markers", {
            "type": "geojson",
            "data": getMarkers(stationObjects)
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

    });

   //  findPOINear(stationObjects[0]);

    // Find Streetview Images for a Lat & Long Pair

    findImageForCoords(stationObjects[0].details.latitude, stationObjects[0].details.longitude);


    document.getElementById('flyButton').addEventListener('click', function () {

        currentStationCentered = currentStationCentered + 1;

        map.flyTo({
            speed: 0.4, // make the flying slow
            curve: 1, // change the speed at which it zooms out
            center: [
                stationObjects[currentStationCentered].details.longitude,
                stationObjects[currentStationCentered].details.latitude]
        });

        findImageForCoords(stationObjects[currentStationCentered].details.latitude, stationObjects[currentStationCentered].details.longitude);


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

function getMarkers (theStations) {

    var station1Lat = parseFloat(theStations[0].details.latitude);
    var station1Lng = parseFloat(theStations[0].details.longitude);

    var station2Lat = parseFloat(theStations[1].details.latitude);
    var station2Lng = parseFloat(theStations[1].details.longitude);

    var station3Lat = parseFloat(theStations[2].details.latitude);
    var station3Lng = parseFloat(theStations[2].details.longitude);

    var station4Lat = parseFloat(theStations[3].details.latitude);
    var station4Lng = parseFloat(theStations[3].details.longitude);

    var station5Lat = parseFloat(theStations[4].details.latitude);
    var station5Lng = parseFloat(theStations[4].details.longitude);



    var thisTest = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station1Lng, station1Lat]
                    },
                    "properties": {
                        "title": theStations[0].details.name,
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
                        "title": theStations[1].details.name,
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
                        "title": theStations[2].details.name,
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
                        "title": theStations[3].details.name,
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
                        "title": theStations[4].details.name,
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
    var stationLocation = new google.maps.LatLng(station.details.latitude, station.details.longitude);

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
    img.src = "https://maps.googleapis.com/maps/api/streetview?size=400x400&location=" + latitude + "," + longitude + "&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo";
    img.width = 500;
    img.height = 200;

    // This next line will just add it to the <body> tag
    var visDiv = document.getElementById('vis');
    var buttonDiv = document.getElementById('flyButton');
    visDiv.insertBefore(img, buttonDiv);

}
