var chart;

var width = 1300; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 600; // THIS TOO.

var boxSize = 6;
var boxWidth = 9;
var boxHeight = 4;
var boxSpacing = 2;
var boxWidthMultipler = boxWidth + boxSpacing
var boxHeightMultipler = boxHeight + boxSpacing

var xSpacing = 50;
var ySpacing = 500;

var theBikeID = 23458;

// DATA THINGS
var validMonths = 8;
var numSegments = 10; // Number of segments per month
var segmentSize = 3; // Number of days per segment

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
        .attr('width', width)
        .attr('height', height);
    vis = chart.append('g');
}

updateViz('month', 'gender');

//Called when the update button is clicked
function updateViz(organizer, sorter) {
    getRidesForBike(theBikeID).then(function(dataset) {

        // console.log(dataset)
        console.log('getting rides')

        var sortedData = sortDataBy2(organizer, sorter, dataset, 'subscriber') // returns data already parsed by customer type
        var customerData = sortDataBy2(organizer, sorter, dataset, 'customer')
        console.log(sortedData)

        plotDataByMonth(sortedData, customerData)
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
            } else if (dateStamp.getDate() > segmentSize * 4 && dateStamp.getDate() <= segmentSize * 5) {
                segmentNumber = 4;
            } else if (dateStamp.getDate() > segmentSize * 5 && dateStamp.getDate() <= segmentSize * 6) {
                segmentNumber = 5;
            } else if (dateStamp.getDate() > segmentSize * 6 && dateStamp.getDate() <= segmentSize * 7) {
                segmentNumber = 6;
            } else if (dateStamp.getDate() > segmentSize * 7 && dateStamp.getDate() <= segmentSize * 8) {
                segmentNumber = 7;
            } else if (dateStamp.getDate() > segmentSize * 8 && dateStamp.getDate() <= segmentSize * 9) {
                segmentNumber = 8;
            } else if (dateStamp.getDate() > segmentSize * 9) {
                segmentNumber = 9;
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

function sortDataBy2(organizer, sorter, dataset, userType) {
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

        // Nest rides by time (for TIME AXIS)
    } else if (organizer == 'month') {
        // This is a beautiful sort function. This developer must be really smart.
        if (userType == 'subscriber') {
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
         } else if (userType == 'customer') {
            var sortedRides = d3.nest() // Nest into months
                .key(function(d) {
                    var dateObject = new Date(d.startTime); // Convert timestamp to Date object
                    console.log(dateObject.getMonth())
                    return dateObject.getMonth(); // return month from object
                }).sortKeys(d3.ascending)
                .key(function(d) {
                    return d.segment; // Subnest by segment
                }).sortKeys(d3.ascending)
                .entries(dataset.customer);
         }

        var validMonths = 8; // Number of continuous months with valid data

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

function plotDataByAge(ridesByAge) {
    // Get width of div
    var element = document.getElementsByClassName('viz-area');

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

function plotDataByMonth(sortedData, customerData) {
    var axisBoxWidth = (numSegments * boxWidth) + ((numSegments - 1) * boxSpacing)
    var totalAxisWidth = (axisBoxWidth * validMonths) + (boxSpacing * 10)

    // AXIS DEFINITION
    vis.append('g')
        .selectAll('body')
        .data([0, 1, 2, 3, 4, 5, 6, 7])
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
        .data(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'])
        .enter()
        .append('text')
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return ((xSpacing - 2) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)) + 40
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
                if (sortedData[month].values[seg].values !== undefined) {
                    console.log('hello')
                        // Gender Dist
                    var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1
                    vis.append('g')
                        .selectAll('body')
                        .data(sortedData[month].values[seg].values)
                        .enter()
                        .append('rect')
                        .attr('x', xLoc) // circle -> cx
                        .attr('y', function(d, j) { // circle -> cy
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
