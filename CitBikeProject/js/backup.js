var map;
var service;


//Gets called when the page is loaded.
function init(){
    
}


function initMap() {

    var stationObjects = demoSetupCode();
    
    // Initialize the MapBox Map
    mapboxgl.accessToken = 'pk.eyJ1IjoidTJwcmlkZSIsImEiOiJjaXVxdzQwZXgwMDJtMnlsZmhiZ210bXAxIn0.sagkmIswAS2ter40NW0DBA';
    var map = new mapboxgl.Map({
        container: 'mapBoxMap',
        center: [-73.98808416, 40.74854862],
        zoom: 10,
        style: 'mapbox://styles/mapbox/streets-v9'
    });
    
    
    map.on('load', function () {
        
        map.addSource("points", {
            "type": "geojson",
            "data": getMarkers(stationObjects)
        });

        map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": "points",
            "layout": {
                "icon-image": "{icon}-15",
                "text-field": "{title}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 0.6],
                "text-anchor": "top"
            }
        });
    });
    
    
    
    /*
    map.on('style.load', function () {

        map.addSource("markers", {
            "type": "geojson",
            "data": createGeoJSONWithStations(stationObjects)
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
    */
    
    
    
    //L.mapbox.accessToken = 'pk.eyJ1IjoidTJwcmlkZSIsImEiOiJjaXVxdzQwZXgwMDJtMnlsZmhiZ210bXAxIn0.sagkmIswAS2ter40NW0DBA';
    //var map = L.mapbox.map('map', 'mapbox.streets');
    
    //var geojson = createGeoJSONWithStations(stationObjects);

    
    //map.setGeoJSON(geojson);
    
    //var myLayer = L.mapbox.featureLayer().setGeoJSON(geojson).addTo(mapSimple);
    
    
    
    
    findPOINear(stationObjects[0]);
    findImageForCoords(stationObjects[0].details.latitude, stationObjects[0].details.longitude);
    addMarkersToMap(map, stationObjects);
    
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
                        "title": "",
                        "description": '155 9th St, San Francisco',
                        "marker-color": '#63b6e5',
                        "marker-size": 'large',
                        "marker-symbol": 'rocket'
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station2Lng, station2Lat]
                    },
                    "properties": {
                        "title": "",
                        "icon": "bicycle",
                        "size": "large"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station3Lng, station3Lat]
                    },
                    "properties": {
                        "title": "",
                        "icon": "bicycle"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station4Lng, station4Lat]
                    },
                    "properties": {
                        "title": "",
                        "icon": "bicycle"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [station5Lng, station5Lat]
                    },
                    "properties": {
                        "title": "",
                        "icon": "bicycle"
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



// I'm given the five most common stations for a bike. 
// 1.  Pull back a street view image for each of them
// 2.  Add a marker for each one to the Mapbox map

// 3.  Pull back a street view image for a POI near each station.







//Function - Search for Nearby POI for a station
//Inputs - Mapbox Map & Array of Station Objects (converted from JSON string to Javascript Object)
//Returns - Nothing, callback is called, see logic in callback

function addMarkersToMap(map, stationsToShow) {
    
    var geojson = createGeoJSONWithStations(stationsToShow);
    
    //var myLayer = L.mapbox.featureLayer().setGeoJSON(geojson).addTo(map);
    
    //geojson.features.forEach(function(marker) {
        // create a DOM element for the marker
        //var el = document.createElement('div');
        //el.className = 'marker';
        //el.style.backgroundImage = 'url(https://placekitten.com/g/' + marker.properties.iconSize.join('/') + '/)';
        //el.style.width = marker.properties.iconSize[0] + 'px';
        //el.style.height = marker.properties.iconSize[1] + 'px';

        //el.addEventListener('click', function() {
        //    window.alert(marker.properties.message);
        //});

        // add marker to map
        //new mapboxgl.Marker(el, {offset: [-marker.properties.iconSize[0] / 2, -marker.properties.iconSize[1] / 2]})
        //    .setLngLat(marker.geometry.coordinates)
        //    .addTo(map);
    //});
    
}







//TODO: Update to only show one result and use more relevant type for nearbySearch

//Function - Search for Nearby POI for a station
//Inputs - Station Object with Lat, Long
//Returns - Nothing, callback is called, see logic in callback
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
        types: ['store']
    };

    // Perform Places Search & run callback on completion
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, foundStationPOIs);
    
}



//TODO: Write equivalent function to place markers on a MapBox Map.

// Function - Create Map Markers for Google Map
// Inputs - A place object from Google Maps
// Returns - None
function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    google.maps.event.addListener(marker, 'click', function() {
        console.log(place.name);
    });
    
}



// Function - Finds an Google Street View Image for a Location
// Inputs - Latitude & Longitude Values
// Returns - image
function findImageForCoords(latitude, longitude) {
    
    var img = document.createElement("img");
    img.src = "https://maps.googleapis.com/maps/api/streetview?size=400x400&location=" + latitude + "," + longitude + "&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo";
    img.width = 640;
    img.height = 640;

    // This next line will just add it to the <body> tag
    document.body.appendChild(img);
    
}



// --------------------------------------------------------------------------
// HELPER FUNCTIONS



// Function - Step through Places Search Results & Create Markers for Each
// Inputs - Results from nearbySearch request
// Returns - None
function foundStationPOIs(results, status) {
  
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
        var place = results[i]; 
        createMarker(results[i]);
        }
    }
    
}


// Purpose:  Creates GeoJSON from Javascript Objects of Stations

function createGeoJSONWithStations(theStations) {

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
    
    
    var stationsGeoJSON = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station1Lng,
                        station1Lat
                    ]
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station2Lng,
                        station2Lat
                    ]
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station3Lng,
                        station3Lat
                    ]
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station4Lng,
                        station4Lat
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "message": "Foo",
                    "iconSize": [60, 60]
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station5Lng,
                        station5Lat
                    ]
                }
            }
        ]
    };
    

    return stationsGeoJSON;
}






















// ARCHIVE CODE


   /* //Convert JSON Strings to Javascript Objects
    
    var s1parsed = JSON.parse(station1Example);
    var s2parsed = JSON.parse(station2Example);
    var s3parsed = JSON.parse(station3Example);
    var s4parsed = JSON.parse(station4Example);
    var s5parsed = JSON.parse(station5Example);
        
    //var str1 = JSON.stringify(s1parsed);
    //console.log("show me" + str1);

    //var stringTest = s1parsed.details;
    //var str2 = JSON.stringify(stringTest);
    //console.log("show me again" + str2);

    //Combine into an array.
    var stationObjects = [s1parsed, s2parsed, s3parsed, s4parsed, s5parsed];
    
    var str1 = JSON.stringify(stationObjects);
    console.log("compare this" + str1);
    
    //var stringTest2 = stationObjects[0].details.latitude;
    //var str3 = JSON.stringify(stringTest2);
    //console.log("show me again" + str3);
    
    
    var stringTest2 = stationObjects[0].details.latitude;
    var str3 = JSON.stringify(stringTest2);
    console.log("THIS IS A TEST" + str3); */



  //httpGetAsync("https://maps.googleapis.com/maps/api/streetview?size=400x400&location=40.720032,-73.988354&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo", showImage);

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}




function showImage() {
  var rawResponse = "�PNG...."; // truncated for example

  // convert to Base64
  var b64Response = btoaa(rawResponse);

  // create an image
  var outputImg = document.createElement('img');
  outputImg.src = 'data:image/png;base64,'+b64Response;

  // append it to your page
  document.body.appendChild(outputImg);

}

// Old Stations for Testing
//var station1 = {latitude:"40.780032", longitude:"-73.988354", name:"Station_One"};
//var station2 = {latitude:"40.720032", longitude:"-73.988354", name:"Station_Two"};
//var station3 = {latitude:"40.720032", longitude:"-73.988354", name:"Station_Three"};
//var station4 = {latitude:"40.720032", longitude:"-73.988354", name:"Station_Four"};
//var station5 = {latitude:"40.720032", longitude:"-73.988354", name:"Station_Five"};

//var stations = [station1, station2, station3, station4, station5];

/*
           {
                "type": "Feature",
                "properties": {
                    "message": "Foo",
                    "iconSize": [60, 60]
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        station5Lng,
                        station5Lat
                    ]
                }
            }

*/
