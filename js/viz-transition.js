// FIREBASE INIT

var chart;

var width = 850; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 700; // THIS TOO.

//var theBikeID = 23458;

// DATA THINGS
validMonths = 8;
var numSegments = 5; // Number of segments per month
var segmentSize = 6; // Number of days per segment

var map;
var service;
var currentStationCentered = 0;

var bikeID = readCookie("selectedBike");
console.log("selected bike " + bikeID);

var allStations;
var allPOIs;

var theIMG;


//Gets called when the page is loaded.
function init() {

    // Create neccessary HTML objects - SW
    var rightDiv = document.getElementsByClassName('transitionView-mapSection');
    var mapBoxMapDiv = document.createElement('div');
    mapBoxMapDiv.id = 'mapBoxMap';
    rightDiv[0].appendChild(mapBoxMapDiv);

    // Initialize the MapBox Map - Center on the middle of New York
    mapboxgl.accessToken = 'pk.eyJ1IjoidTJwcmlkZSIsImEiOiJjaXVxdzQwZXgwMDJtMnlsZmhiZ210bXAxIn0.sagkmIswAS2ter40NW0DBA';
    map = new mapboxgl.Map({
        container: 'mapBoxMap',
        center: [-73.985130, 40.758896],
        zoom: 14,
        style: 'mapbox://styles/u2pride/ciwe2r5w500012psgzw5womb0'
    });

    map.on('load', function () {
        initMap();
    });

    var fadeInStory = document.getElementById("beginningStoryText");
    fadeIn(fadeInStory);

    setTimeout(fadeInMapComponents, 5000);

}


function fadeOutEverything() {

    var element1 = document.getElementById("transitionView-streetViewImage");
    fadeOut(element1);

    var element2 = document.getElementById("transitionView-stationLabel");
    fadeOut(element2);

    var element3 = document.getElementById("FullScreenMapBoxMap");
    fadeOut(element3);

    document.getElementById("beginningStoryText").innerHTML = "TEST";
    document.getElementById("beginningStoryText").style.display = "inline-grid";
    var element4 = document.getElementById("beginningStoryText");
    fadeIn(element4);

    //var endStory = document.getElementById("endStoryText");
    //endStory.style.display = "table-cell";
    //fadeIn(endStory);

    setTimeout(navigateToStationView, 2000);


}

function navigateToStationView() {
  window.location.href = "./stationView.html";
}


function fadeInMapComponents() {

  var element1 = document.getElementById("transitionView-streetViewImage");
  fadeIn(element1);

  var element2 = document.getElementById("transitionView-stationLabel");
  fadeIn(element2);

  var element3 = document.getElementById("FullScreenMapBoxMap");
  fadeIn(element3);

  var fadeOutStory = document.getElementById("beginningStoryText");
  fadeOut(fadeOutStory);

}


/* Notes
Page Loads
Get Birth Station
Get Four Popular Stations
Get POI for each Station
Get Images for each POI
*/

///////////////////////////////////////////////////////////////////////////////
// EVERYTHING

function initMap() {

  allStations = new Array();
  allPOIs = new Array();



  setTimeout(flyToNextStation, 8000);
  setTimeout(flyToNextStation, 12000);
  setTimeout(flyToNextStation, 16000);
  setTimeout(flyToNextStation, 20000);

  setTimeout(fadeOutEverything, 25000);

    //Get Birth Station
    getBirthStationForBike(bikeID).then(function(birthStationID) {

        getStationForID(birthStationID).then(function(stationData) {

            allStations.push(stationData);

            //Now that we have the birth station, center the map.
            map.flyTo({

                center: [
                    allStations[0].longitude,
                    allStations[0].latitude
                ]
            });

            document.getElementById('transitionView-stationLabel').innerHTML = "Birth Station";

            //console.log("Station Data" + JSON.stringify(stationData));
            //console.log("getting the station latitude " + stationData.latitude)
            //for each station, step through and grab a POI near it from Foursquare

            //TODO getPOIForStation(stationData);
            // Once the map loads, add the Markers from the GeoJSON File
            //   map.on('style.load', function() {
            getPopularStationIDsForBike(bikeID).then(function(stationsList) {
                console.log("popular station IDs - " + stationsList);

                for (var i = 0; i < stationsList.length; i++) {
                    if (i == (stationsList.length - 1)) {
                        getStationForID(stationsList[i]).then(function(theStation) {
                            allStations.push(theStation);

                            console.log("all da stations" + JSON.stringify(allStations));
                            //var markersReturned = ;
                            console.log("heres what getMarkers returns" + JSON.stringify(getMarkers(allStations)));

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
            })
        })
    })
}





///////////////////////////////////////////////////////////////////////////////
// FLY FUNCTION

function flyToNextStation() {

  currentStationCentered = currentStationCentered + 1;

  map.flyTo({
      speed: 0.4, // make the flying slow
      curve: 1, // change the speed at which it zooms out
      center: [
          allStations[currentStationCentered].longitude,
          allStations[currentStationCentered].latitude
      ]
  });

  if (currentStationCentered == 1) {
    document.getElementById('transitionView-stationLabel').innerHTML = "Most Visited Station";

  }

  if (currentStationCentered == 2) {
    document.getElementById('transitionView-stationLabel').innerHTML = "Second Most Visited Station";

  }

  if (currentStationCentered == 3) {
    document.getElementById('transitionView-stationLabel').innerHTML = "Third Most Visited Station";

  }

  if (currentStationCentered == 4) {
    document.getElementById('transitionView-stationLabel').innerHTML = "Fourth Most Visited Station";

  }


  findImageForCoords(allStations[currentStationCentered].latitude, allStations[currentStationCentered].longitude);

}



///////////////////////////////////////////////////////////////////////////////
// FIREBASE CALLS - GET BIRTH STATION, GET POPULAR STATION IDS, GET STATION FOR ID

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

function getStationForID(stationID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stationObject = new Object();
    return ref.child('stations/' + stationID + '/details/').orderByKey().once("value").then(function(snapshot) {

        var latitude = snapshot.val();
        console.log("station object - " + JSON.stringify(latitude));

        var dataObject = snapshot.val()

        if (dataObject.latitude) {
            stationObject = dataObject;
        }

    }).then(function() {
        return stationObject;
    });
};



///////////////////////////////////////////////////////////////////////////////
// GET POIs NEAR A STATION - USING FOURSQUARE API

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


///////////////////////////////////////////////////////////////////////////////
// CREATE MARKERS FOR MAPBOX FROM FIREBASE OBJECTS


function getMarkers(theStations) {

    //console.log("check all this " + theStations);
    //console.log("check all this " + JSON.stringify(theStations));

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
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station2Lng, station2Lat]
            },
            "properties": {
                "title": theStations[1].name,
                "marker-symbol": "bicycle"
            }
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station3Lng, station3Lat]
            },
            "properties": {
                "title": theStations[2].name,
                "marker-symbol": "bicycle"
            }
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station4Lng, station4Lat]
            },
            "properties": {
                "title": theStations[3].name,
                "marker-symbol": "bicycle"
            }
        }, {
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
    }
    return thisTest;

}




///////////////////////////////////////////////////////////////////////////////
// GOOGLE STREET VIEW IMAGE

function findImageForCoords(latitude, longitude) {

    if (!theIMG) {
      theIMG = document.createElement("IMG");
    }

    theIMG.src = "https://maps.googleapis.com/maps/api/streetview?size=450x300&location=" + latitude + "," + longitude + "&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo";

    var img = document.getElementById('transitionView-streetViewImage').appendChild(theIMG);

}


///////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS

function fadeIn(el) {
  el.style.opacity = 0;
  var tick = function () {
    el.style.opacity = +el.style.opacity + 0.01;
    if (+el.style.opacity < 1) {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
    }
  };
  tick();
}

function fadeOut(el){
  el.style.opacity = 1;

  (function fade() {
    if ((el.style.opacity -= .1) < 0) {
      el.style.display = "none";
    } else {
      requestAnimationFrame(fade);
    }
  })();
}


function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
