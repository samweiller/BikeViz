// FIREBASE INIT

var chart;

var width = 850; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 700; // THIS TOO.

var boxSize = 6;
var boxWidth = 10;
var boxHeight = 3;
var boxSpacing = 2;
var boxWidthMultipler = boxWidth + boxSpacing
var boxHeightMultipler = boxHeight + boxSpacing

var xSpacing = 75;
var ySpacing = 500;

var theBikeID = 23458;

// DATA THINGS
validMonths = 8;
var numSegments = 5; // Number of segments per month
var segmentSize = 6; // Number of days per segment

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

updateViz('month', 'gender');
// initMap();

//Called when the update button is clicked
function updateViz(organizer, sorter) {
    getRidesForBike(theBikeID).then(function(dataset) {

        // console.log(dataset)
        console.log('getting rides')

        var sortedData = sortDataBy2(organizer, sorter, dataset) // returns data already parsed by customer type
        console.log(sortedData)

        plotDataByMonth(sortedData)

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

    //  var fullDataArray = new Object();
    //  var fullDataArray.subscriber = []
    //  var fullDataArray.customer = []

    var fullDataArray = {
        'subscriber': [],
        'customer': []
    }

    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var dataObject = childSnapshot.val()

            var dateStamp = new Date(dataObject.startTime);

            var segmentNumber = -1;

            // For some reason this didn't work at all as a simple for loop.
            if (dateStamp.getDate() <= segmentSize) {
                segmentNumber = 0;
            } else if (dateStamp.getDate() > segmentSize && dateStamp.getDate() <= segmentSize * 2) {
                segmentNumber = 1;
            } else if (dateStamp.getDate() > segmentSize * 2 && dateStamp.getDate() <= segmentSize * 3) {
                segmentNumber = 2;
            } else if (dateStamp.getDate() > segmentSize * 3 && dateStamp.getDate() <= segmentSize * 4) {
                segmentNumber = 3;
            } else if (dateStamp.getDate() > segmentSize * 3) {
                segmentNumber = 4;
            }

            if (dataObject.user.type == 'Subscriber') {
                var theRefactoredObject = {
                    'rideID': childSnapshot.key,
                    'bikeID': bikeID,
                    'stationID': dataObject.startStation,
                    'gender': dataObject.user.gender,
                    'userType': dataObject.user.type,
                    'age': 2016 - Number(dataObject.user.birthYear),
                    'startTime': dataObject.startTime,
                    'segment': segmentNumber
                }

                fullDataArray.subscriber.push(theRefactoredObject);
            } else if (dataObject.user.type == 'Customer') {
                var theRefactoredObject = {
                    'rideID': childSnapshot.key,
                    'bikeID': bikeID,
                    'stationID': dataObject.startStation,
                    'gender': 'not available',
                    'userType': dataObject.user.type,
                    'age': 'not available',
                    'startTime': dataObject.startTime,
                    'segment': segmentNumber
                }

                fullDataArray.customer.push(theRefactoredObject);
            }
        });
    }).then(function() {
        return fullDataArray
    });
};

function sortDataBy2(organizer, sorter, dataset) {
    // Organizer -> age/month (x axis)
    // Sorter -> gender/time (y axis)

    // Nest rides by age (for AGE AXIS)
    if (organizer == 'age') {
        var sortedRides = d3.nest()
            .key(function(d) {
                return d.age; // return age as nesting key
            }).sortKeys(d3.ascending) // Sort by age within bin
            .entries(dataset.subscriber);

        // add option to sort by gender.
        var validAges = 60;
        var minAge = 16
        var maxAge = 75

        for (age = 0; age < validAges; age++) {
            if (sortedRides[age].key == age + 16) {
                // all is well
            } else {
                var myQuickKey = age + 16;
                sortedRides.splice(age, 0, {
                    key: String(age + 16)
                });
            }
        }

        sortedRides = sortedRides.slice(0, validAges);

        //   for (i = 0; i <= sortedRides.length; i++) { // Iterate over all entries in sortedRides
        //       // TODO: THIS IS WRONG.
        //       if (sortedRides[i] !== undefined) { // make sure given level of sortedRides exists
        //           if (sortType == 'time') { // sort by time
        //               return sortedRides
        //           } else { // otherwise sort by gender
        //               sortedRides[i].values = sortedRides[i].values.sort(function(a, b) {
        //                   return d3.ascending(a.gender, b.gender);
        //               });
        //           }
        //       }
        //   }

        // Nest rides by time (for TIME AXIS)
    } else if (organizer == 'month') {
        // This is a beautiful sort function. This developer must be really smart.
        var sortedRides = d3.nest() // Nest into months
            .key(function(d) {
                var dateObject = new Date(d.startTime); // Convert timestamp to Date object
                console.log(dateObject.getMonth())
                return dateObject.getMonth(); // return month from object
            }).sortKeys(d3.ascending)
            .key(function(d) {
                return d.segment; // Subnest by segment
            }).sortKeys(d3.ascending)
            .entries(dataset.subscriber);

        var validMonths = 8; // Number of continuous months with valid data
        //   var numSegments = 5; // Number of segments per month
        //   var segmentSize = 6; // Number of days per segment

        // This makes sure that array index matches month key. If a given month has no rides, insert an empty object in that space in the array.
        console.log(sortedRides)
        for (month = 0; month < validMonths; month++) {
            if (sortedRides[month] == undefined) {
                sortedRides[month] = {
                    key: 'x'
                }
            }
            if (sortedRides[month].key == month) {
                // all is well
                for (seg = 0; seg < numSegments; seg++) { // Same as above, but for segments.
                    if (sortedRides[month].values[seg] == undefined) {
                        sortedRides[month].values[seg] = {
                            key: 'x'
                        }
                    }
                    if (sortedRides[month].values[seg].key == seg) {
                        // all is well
                    } else {
                        sortedRides[month].values.splice(seg, 0, {
                            seg: 'x'
                        });
                    }
                }
                sortedRides[month].values = sortedRides[month].values.slice(0, numSegments);
            } else {
                sortedRides.splice(month, 0, {
                    month: 'x'
                });
            }
        }
    }

    return sortedRides
}

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

function plotDataByAge(ridesByAge) {
    // Get width of div
    var element = document.getElementsByClassName('bikeView-left');
    // console.log(element[0].clientWidth)

    var axisBoxWidth = (10 * boxWidth) + (9 * boxSpacing)
    var totalAxisWidth = (axisBoxWidth * 6) + (boxSpacing * 4)

    xSpacing = (element[0].clientWidth - totalAxisWidth) / 2

    // AXIS DEFINITION
    vis.append('g')
        .selectAll('body')
        .data([0, 1, 2, 3, 4, 5])
        .enter()
        .append('rect')
        .attr('x', function(d, i) {
            return (xSpacing - 1) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)
        })
        .attr('y', ySpacing + 8)
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
        .attr('x', function(d, i) {
            return ((xSpacing - 2) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)) + 10
        })
        .attr('y', ySpacing + 20)
        .attr('height', 25)
        .attr('width', axisBoxWidth)
        .style('fill', 'white')
        .style('font-size', '14px')

    for (i = 16 - 16; i <= 75 - 16; i++) {
        var svg = d3.select('svg');

        if (ridesByAge[i].values !== undefined) {

            // Gender Dist
            vis.append('g')
                .selectAll('body')
                .data(ridesByAge[i].values)
                .enter()
                .append('rect')
                .attr('x', ((i + 0) * boxWidthMultipler) + xSpacing + 1) // circle -> cx
                .attr('y', function(d, j) { // circle -> cy
                    //   console.log(d)
                    //   console.log(j)
                    // console.log(ySpacing - (j * boxHeightMultipler))
                    return ySpacing - (j * boxHeightMultipler);
                })
                .attr('height', boxHeight) // circle -> r -> boxSize/2
                .attr('width', boxWidth)
                .attr("class", function(d, i) {
                    if (d.gender == 1) {
                        var genderClass = 'case-male';
                    } else {
                        var genderClass = 'case-female';
                    }

                    var rectClass = 'age' + d.age;

                    return 'ride-box ' + rectClass + ' ' + genderClass
                })
        }
    }
}

function plotDataByMonth(sortedData) {
    var axisBoxWidth = (5 * boxWidth) + (4 * boxSpacing)
    var totalAxisWidth = (axisBoxWidth * 12) + (boxSpacing * 10)

    // AXIS DEFINITION
    vis.append('g')
        .selectAll('body')
        .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .enter()
        .append('rect')
        .attr('x', function(d, i) {
            return (xSpacing - 1) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)
        })
        .attr('y', ySpacing + 8)
        .attr('height', 15)
        .attr('width', axisBoxWidth)
        .style('fill', 'black')

    vis.append('g')
        .selectAll('body')
        .data(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .enter()
        .append('text')
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return ((xSpacing - 2) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)) + 10
        })
        .attr('y', ySpacing + 20)
        .attr('height', 25)
        .attr('width', axisBoxWidth)
        .style('fill', 'white')
        .style('font-size', '14px')

    console.log(sortedData)
    for (month = 0; month < validMonths; month++) {
        var svg = d3.select('svg');
        if (sortedData[month].values !== undefined) {
            for (seg = 0; seg < numSegments; seg++) {
               // console.log(sortedData[month].values[seg].values)
                if (sortedData[month].values[seg].values !== undefined) {
                   console.log('hello')
                    // Gender Dist
                    var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1
                  //   var xLoc = ((month * seg * boxWidthMultipler) + xSpacing + 1)
                    vis.append('g')
                        .selectAll('body')
                        .data(sortedData[month].values[seg].values)
                        .enter()
                        .append('rect')
                        .attr('x', xLoc) // circle -> cx
                        .attr('y', function(d, j) { // circle -> cy
                            //   console.log(d)
                            //   console.log(j)
                            // console.log(ySpacing - (j * boxHeightMultipler))
                            return ySpacing - (j * boxHeightMultipler);
                        })
                        .attr('height', boxHeight) // circle -> r -> boxSize/2
                        .attr('width', boxWidth)
                        .attr("class", function(d, i) {
                            if (d.gender == 1) {
                                var genderClass = 'case-male';
                            } else {
                                var genderClass = 'case-female';
                            }

                            var rectClass = 'month' + month + ' segment' + seg + ' age' + d.age;

                            return 'ride-box ' + rectClass + ' ' + genderClass
                        })
                }
            }
        }
    }
}

function initMap() {
    console.log('foo')
        // Assumes Birth Station is listed first
        //  var innerDiv = document.createElement('div');
        // innerDiv.className = 'mapBoxMap';
        //  document.getElementsByTagName('body')[0].appendChild(innerDiv);


    var stationObjects = demoSetupCode();

    // Create neccessary HTML objects - SW
    var rightDiv = document.getElementsByClassName('bikeView-mapSection');
    var mapBoxMapDiv = document.createElement('div');
    mapBoxMapDiv.id = 'mapBoxMap';
    rightDiv[0].appendChild(mapBoxMapDiv);

    var bottomLeftDiv = document.getElementsByClassName('bikeView-UIsection');
    var flyButtonObject = document.createElement('button');
    flyButtonObject.id = 'flyButton';
    var btnText = document.createTextNode('Move to Next Station');
    flyButtonObject.appendChild(btnText);
    bottomLeftDiv[0].appendChild(flyButtonObject);

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
    map.on('style.load', function() {

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


    document.getElementById('flyButton').addEventListener('click', function() {

        currentStationCentered = currentStationCentered + 1;

        getBirthStationForBike(23458).then(function(dataset) {
            console.log(dataset);

            getStation(3230).then(function(stationData) {
                console.log("returned Object" + JSON.stringify(stationData));
                //console.log("getting the station latitude " + stationData.latitude)
            });
        });

        map.flyTo({
            speed: 0.4, // make the flying slow
            curve: 1, // change the speed at which it zooms out
            center: [
                stationObjects[currentStationCentered].details.longitude,
                stationObjects[currentStationCentered].details.latitude
            ]
        });

        findImageForCoords(stationObjects[currentStationCentered].details.latitude, stationObjects[currentStationCentered].details.longitude);


    });

}

function demoSetupCode() {

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
    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().once("value").then(function(snapshot) {

        snapshot.forEach(function(childSnapshot) {

            var dataObject = childSnapshot.val();

            if (birthStation == "") {
                birthStation = dataObject.startStation;
            }

        });

    }).then(function() {
        return birthStation;
    });
};

function getStation(stationID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stationObject = new Object();
    return ref.child('stations/' + stationID).orderByKey().once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var dataObject = childSnapshot.val()

            if (dataObject.latitude) {
                stationObject = dataObject;
            }

        });
    }).then(function() {
        return stationObject;
    });
};

function getMarkers(theStations) {

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
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station2Lng, station2Lat]
            },
            "properties": {
                "title": theStations[1].details.name,
                "marker-symbol": "bicycle"
            }
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station3Lng, station3Lat]
            },
            "properties": {
                "title": theStations[2].details.name,
                "marker-symbol": "bicycle"
            }
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station4Lng, station4Lat]
            },
            "properties": {
                "title": theStations[3].details.name,
                "marker-symbol": "bicycle"
            }
        }, {
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

function demoSetupCode() {

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
    img.src = "https://maps.googleapis.com/maps/api/streetview?size=640x180&location=" + latitude + "," + longitude + "&fov=90&heading=235&pitch=10&key=AIzaSyCqldUCvAMTkbea3wZmY16ghYKLtj6NNFo";
    img.width = 500;
    img.height = 200;

    // This next line will just add it to the <body> tag
    //  var visDiv = document.getElementById('vis');
    //  var buttonDiv = document.getElementById('flyButton');
    var imageDiv = document.getElementsByClassName('bikeView-imageSection');
    imageDiv[0].append(img);

}
