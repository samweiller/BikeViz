var chart;

var width = 1300; // TODO: MAKE THIS DYNAMIC OR YOU'RE AN IDIOT
var height = 625; // THIS TOO. //550

var boxSize = 6;
var boxWidth = 9; //9 // 6
var boxHeight = 1; //4 // 1
var boxSpacing = 0; //2 //0
var boxWidthMultipler = boxWidth + boxSpacing
var boxHeightMultipler = boxHeight + boxSpacing
var boxRadius = 0;
var axisBoxWidth = (10 * boxWidth) + (9 * boxSpacing)
var totalAxisWidth = (axisBoxWidth * 8) + (boxSpacing * 8)
var widthAddition = 50;
var axisHeight = 18;
width = totalAxisWidth + (widthAddition * 2);

// ANIMATION STUFF
var shuffleAnimDuration = 700;
var shuffleAnimType = d3.easeExpInOut;
var fwooshAnimDuration = 1000;
var fwooshAnimType = d3.easePolyInOut;
var axisAnimationDuration = 1000;
var delayTime = 10;

var xSpacing = 00;
var ySpacing = 400; //374

//TODO: get bike id from bikeview page / cookie
var bikeIDTEST = 23458;
var theStationID = getRandomStationNumber(); //324 //3065(demofixed)

console.log(theStationID)

var top50Stations;

// BLACKLIST -> 17392, 17470, 24303, 16353, 15496, 25971, 25144, 15469, 16331, 25004, 26367

// DATA THINGS
var validMonths = 8;
var numSegments = 10; // Number of segments per month
var segmentSize = 3; // Number of days per segment
var tip;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

//DEFINE YOUR VARIABLES UP HERE
console.log('in')

//Gets called when the page is loaded.
function init() {
    d3SpecificInit()
        // Define the div for the tooltip
        theSpin = beginLoadingScreen();
    // Create neccessary HTML objects - SW
    var rightDiv = document.getElementsByClassName('SV-map-area');
    var mapBoxMapDiv = document.createElement('div');
    mapBoxMapDiv.id = 'SV-mapBoxMap';
    mapBoxMapDiv.style.height = "100%";
    rightDiv[0].appendChild(mapBoxMapDiv);

    // Loading Inits


    //Add header to map
    var theMapHeader = document.createElement('div');
    theMapHeader.className = 'SV-bike-name';
    var mapHeaderText = document.createTextNode('Top 50 Stations for bike #' + bikeIDTEST + '.');
    theMapHeader.appendChild(mapHeaderText);

    var mapTitleDiv = document.getElementsByClassName('SV-map-area');
    mapTitleDiv[0].prepend(theMapHeader);

    // Initialize the MapBox Map - Center on the middle of New York
    mapboxgl.accessToken = 'pk.eyJ1IjoidTJwcmlkZSIsImEiOiJjaXVxdzQwZXgwMDJtMnlsZmhiZ210bXAxIn0.sagkmIswAS2ter40NW0DBA';
    map = new mapboxgl.Map({
        container: 'SV-mapBoxMap',
        center: [-73.985130, 40.758896],
        zoom: 14,
        style: 'mapbox://styles/u2pride/ciwe2r5w500012psgzw5womb0'
    });

    map.on('load', function() {
        //initMap();
        console.log("Map loaded");
        top50Stations = new Array();
        loadTop50Stations();
    });


    map.on('click', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['markers']
        });

        if (!features.length) {
            return;
        }
        var stationID = features[0].properties.description;

        theDataSets = updateViz('month', stationID, 0);

    });

    //TODO: cursor style change
    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['markers']
        });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });


}

function d3SpecificInit() {
    chart = d3.select('#vis').append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'svg-area');
    vis = chart.append('g');
}

var organizerType = 'month';
var theDataSets = updateViz('month', theStationID, 1);
var theSpin;
//Called when the update button is clicked
function updateViz(organizer, theStationID, isInit) {

    if (isInit == 0) {
        d3.select("#vis").selectAll("svg").remove();

        var ageOrgButton = document.getElementById('ageBtn')
        ageOrgButton.classList.remove("active");
        var monthOrgButton = document.getElementById('monthBtn')
        monthOrgButton.classList.remove("active");
        var monthOrgButton = document.getElementById('monthBtn')
        monthOrgButton.classList.add("active");

        var theTooltipDiv = document.getElementsByClassName('tooltip')
        if (theTooltipDiv[0] !== undefined) {
            theTooltipDiv[0].parentNode.removeChild(theTooltipDiv[0])
        }
        theSpin = beginLoadingScreen();
        d3SpecificInit();
    }

    return getRidesForStation(theStationID, isInit).then(function(dataset) {
        // START LOADING HERE
        console.log('getting rides')

        var ageData = sortDataBy2('age', dataset)

        var sortedData = sortDataBy2(organizer, dataset, 'subscriber') // returns data already parsed by customer type
        var customerData = sortDataBy2(organizer, dataset, 'customer')

        plotDataByMonth(sortedData, customerData, 1)

        // Create all needed HTML objects
        getNameForStation(theStationID).then(function(stationName) {
            //  console.log(stationName)
            if (isInit == 1) {
                var theHeader = document.createElement('div')
                theHeader.className = 'station-name'
                var headText = document.createTextNode('Rides through the station at ' + stationName + '.');
                theHeader.appendChild(headText);

                var theSubscriberAxisLabel = document.createElement('div')
                theSubscriberAxisLabel.className = 'SV-sub-axis-label'
                var subAxisText = document.createTextNode('Annual Riders')
                var theVizArea = document.getElementsByClassName('SV-viz-area')
                theSubscriberAxisLabel.append(subAxisText);
                theVizArea[0].append(theSubscriberAxisLabel)

                var theCustomerAxisLabel = document.createElement('div')
                theCustomerAxisLabel.className = 'SV-cust-axis-label'
                var custAxisText = document.createTextNode('One-Time Riders')
                var theUIArea = document.getElementsByClassName('SV-UI-area')
                theCustomerAxisLabel.append(custAxisText);
                theUIArea[0].append(theCustomerAxisLabel);

                var theLegend = document.createElement('div')
                theLegend.className = 'SV-legend'
                theLegend.innerHTML = "<div class='SV-legend-male SV-legend-icon'></div><div class='SV-legend-label'>male</div><div class='SV-legend-female SV-legend-icon'></div><div class='SV-legend-label'>female</div><div class='SV-legend-nodata SV-legend-icon'></div><div class='SV-legend-label'>no data</div>"
                var theUIArea = document.getElementsByClassName('SV-UI-area')
                theUIArea[0].append(theLegend)
            } else if (isInit == 0) {
                var theHeader = document.getElementsByClassName('station-name')
                theHeader = theHeader[0]
                var headText = document.createTextNode('Rides through the station at ' + stationName + '.');
                theHeader.innerHTML = "";
                theHeader.appendChild(headText);
            }

            var titleDiv = document.getElementsByClassName('SV-title-area');
            titleDiv[0].append(theHeader);

            theSpin.stop();
        });


        return [ageData, sortedData, customerData]
    });
};

function beginLoadingScreen() {
    var opts = {
        lines: 13 // The number of lines to draw
            ,
        length: 33 // The length of each line
            ,
        width: 9 // The line thickness
            ,
        radius: 43 // The radius of the inner circle
            ,
        scale: 0.25 // Scales overall size of the spinner
            ,
        corners: 1 // Corner roundness (0..1)
            ,
        color: '#000' // #rgb or #rrggbb or array of colors
            ,
        opacity: 0.25 // Opacity of the lines
            ,
        rotate: 0 // The rotation offset
            ,
        direction: 1 // 1: clockwise, -1: counterclockwise
            ,
        speed: 1 // Rounds per second
            ,
        trail: 60 // Afterglow percentage
            ,
        fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
            ,
        zIndex: 2e9 // The z-index (defaults to 2000000000)
            ,
        className: 'spinner' // The CSS class to assign to the spinner
            ,
        top: '50%' // Top position relative to parent
            ,
        left: '50%' // Left position relative to parent
            ,
        shadow: false // Whether to render a shadow
            ,
        hwaccel: false // Whether to use hardware acceleration
            ,
        position: 'absolute' // Element positioning
    }
    var target = document.getElementById('vis')

    return new Spinner(opts).spin(target);
}

function endLoadingScreen() {

}

//Callback for when data is loaded
function update(rawdata) {
    //PUT YOUR UPDATE CODE BELOW
}

function orgByMonth() {
    organizerType = 'month';
    theDataSets.then(function(data) {
        plotDataByMonth(data[1], data[2], 0)
        var ageOrgButton = document.getElementById('ageBtn')
        ageOrgButton.classList.remove("active");
        var monthOrgButton = document.getElementById('monthBtn')
        monthOrgButton.classList.add("active");

        var genderSortButton = document.getElementById('genderBtn')
        genderSortButton.classList.remove("active");
        var timeSortButton = document.getElementById('timeBtn')
        timeSortButton.classList.add("active");

        var theTooltipDiv = document.getElementsByClassName('tooltip')
        if (theTooltipDiv[0] !== undefined) {
            theTooltipDiv[0].parentNode.removeChild(theTooltipDiv[0])
        }
    })
}

function orgByAge() {
    organizerType = 'age';
    theDataSets.then(function(data) {
        plotDataByAge(data[0]) // age data
        var ageOrgButton = document.getElementById('ageBtn')
        ageOrgButton.classList.add("active");
        var monthOrgButton = document.getElementById('monthBtn')
        monthOrgButton.classList.remove("active");

        var genderSortButton = document.getElementById('genderBtn')
        genderSortButton.classList.remove("active");
        var timeSortButton = document.getElementById('timeBtn')
        timeSortButton.classList.add("active");

        var theTooltipDiv = document.getElementsByClassName('tooltip')
        if (theTooltipDiv[0] !== undefined) {
            theTooltipDiv[0].parentNode.removeChild(theTooltipDiv[0])
        }
    })
}

function byTime() {
    updateViz('time');
}

function getRidesForStation(stationID) {
    var db = firebase.database();
    var ref = db.ref("/");
    var fullDataArray = {
        'subscriber': [],
        'customer': []
    }

    return ref.child('stations/' + stationID + '/rides/').orderByKey().once("value").then(function(snapshot) {
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

            var segIndex = (numSegments * dateStamp.getMonth()) + segmentNumber

            if (dataObject.user.type == 'Subscriber') {
                var theRefactoredObject = {
                    'rideID': childSnapshot.key,
                    'bikeID': 99999,
                    'stationID': dataObject.startStation,
                    'startStation': dataObject.startStation,
                    'endStation': dataObject.endStation,
                    'gender': dataObject.user.gender,
                    'userType': dataObject.user.type,
                    'age': Number(2016 - Number(dataObject.user.birthYear)),
                    'startTime': dataObject.startTime,
                    'segment': segmentNumber,
                    'month': dateStamp.getMonth(),
                    'segmentIndex': segIndex,
                    'duration': dataObject.duration
                }
                fullDataArray.subscriber.push(theRefactoredObject);
            } else if (dataObject.user.type == 'Customer') {
                var theRefactoredObject = {
                    'rideID': childSnapshot.key,
                    'bikeID': 99999,
                    'stationID': dataObject.startStation,
                    'startStation': dataObject.startStation,
                    'endStation': dataObject.endStation,
                    'gender': 'not available',
                    'userType': dataObject.user.type,
                    'age': 'not available',
                    'startTime': dataObject.startTime,
                    'segment': segmentNumber,
                    'month': dateStamp.getMonth(),
                    'segmentIndex': segIndex,
                    'duration': dataObject.duration
                }

                fullDataArray.customer.push(theRefactoredObject);
            }
        });
    }).then(function() {
        return fullDataArray
    });
};

function sortDataBy2(organizer, dataset, userType) {
    // Organizer -> age/month (x axis)

    // Nest rides by age (for AGE AXIS)
    console.log(dataset.subscriber)
    if (organizer == 'age') {
        var sortedRides = d3.nest()
            .key(function(d) {
                return d.age; // return age as nesting key
            }).sortKeys(function(a, b) {
                return (+a) - (+b);
            }) // Sort by age within bin
            .entries(dataset.subscriber);

        console.log(sortedRides.length)
        console.log(sortedRides)
        console.log(sortedRides[sortedRides.length - 1])
        var validAges = 60;
        var minAge = 16
        var maxAge = 75

        // add fix for if ages

        for (age = 0; age < validAges; age++) {
            if (sortedRides[age] == undefined) {
                sortedRides[age] = {
                    key: 'x'
                }
            }
            if (sortedRides[age].key == age + 16) {
                // all is well
            } else {
                var myQuickKey = age + 16;
                sortedRides.splice(age, 0, {
                    key: String(age + 16)
                });
            }
        }

        console.log(sortedRides.length)

        sortedRides = sortedRides.slice(0, validAges);

        console.log(sortedRides.length)

        console.log(sortedRides)

        // Nest rides by time (for TIME AXIS)
    } else if (organizer == 'month') {
        // This is a beautiful sort function. This developer must be really smart.
        if (userType == 'subscriber') {
            var sortedRides = d3.nest() // Nest into months
                .key(function(d) {
                    var dateObject = new Date(d.startTime); // Convert timestamp to Date object
                    return dateObject.getMonth(); // return month from object
                }).sortKeys(function(a, b) {
                    return (+a) - (+b);
                })
                .key(function(d) {
                    return d.segment; // Subnest by segment
                }).sortKeys(function(a, b) {
                    return (+a) - (+b);
                })
                .entries(dataset.subscriber);
        } else if (userType == 'customer') {
            var sortedRides = d3.nest() // Nest into months
                .key(function(d) {
                    var dateObject = new Date(d.startTime); // Convert timestamp to Date object
                    return dateObject.getMonth(); // return month from object
                }).sortKeys(function(a, b) {
                    return (+a) - (+b);
                })
                .key(function(d) {
                    return d.segment; // Subnest by segment
                }).sortKeys(function(a, b) {
                    return (+a) - (+b);
                })
                .entries(dataset.customer);
        }

        var validMonths = 8; // Number of continuous months with valid data

        // This makes sure that array index matches month key. If a given month has no rides, insert an empty object in that space in the array.
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
    // console.log(ridesByAge)
    // Get width of div
    var element = document.getElementsByClassName('viz-area');

    var axisBoxWidth = (10 * boxWidth) + (9 * boxSpacing)
    var totalAxisWidth = (axisBoxWidth * 6) + (boxSpacing * 4)

    xSpacing = axisBoxWidth + boxSpacing + widthAddition

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // AXIS DEFINITION
    vis.append('g')
        .attr('class', 'age-axis')
        .selectAll('body')
        .data([0, 1, 2, 3, 4, 5])
        .enter()
        .append('rect')
        .attr('x', function(d, i) {
            return (xSpacing - 1) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)
        })
        .attr('y', ySpacing + 6)
        .attr('height', axisHeight)
        .attr('width', axisBoxWidth)
        .attr('stroke', '#fafafa')
        .style('opacity', 0)
        .transition().duration(axisAnimationDuration).style("opacity", 1);

    vis.append('g')
        .attr('class', 'age-axis-label')
        .selectAll('body')
        .data(['16-25', '26-35', '36-45', '46-55', '56-65', '66-75'])
        .enter()
        .append('text')
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return ((xSpacing - 2) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)) + (axisBoxWidth / 2)
        })
        .attr('y', ySpacing + 20)
        .attr('height', 25)
        .attr('width', axisBoxWidth)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('opacity', 0)
        .transition().duration(axisAnimationDuration).style("opacity", 1);

    vis.selectAll('.month-axis')
        .transition().duration(axisAnimationDuration).style("opacity", 0);

    vis.selectAll('.month-axis-label')
        .transition().duration(axisAnimationDuration).style("opacity", 0);

    vis.selectAll('.cust-box')
        .transition().duration(fwooshAnimDuration)
        .ease(fwooshAnimType)
        .attr('y', ySpacing + 15)
        .style("opacity", 0);


    var groupIndex = 0;
    for (i = 16 - 16; i <= 75 - 16; i++) {
        var svg = d3.select('svg');

        if (ridesByAge[i].values !== undefined) {
            console.log('foo')
            vis.selectAll('.age' + (i + 16))
                .data(ridesByAge[i].values)
                .transition().duration(fwooshAnimDuration)
                .ease(fwooshAnimType)
                .delay(function(d, j) {
                    return j * delayTime
                })
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

                    if (d.userType == 'Customer') {
                        var typeClassifier = 'cust';
                    } else if (d.userType == 'Subscriber') {
                        var typeClassifier = 'sub';
                    }

                    var rectClass = 'month' + d.month + '-' + typeClassifier + ' segment' + d.segment + '-' + typeClassifier + ' age' + d.age + ' age-group' + groupIndex + ' month-group' + d.segmentIndex + '-sub';

                    return 'ride-box ' + rectClass + ' ' + genderClass
                })
                .attr("rx", boxRadius)
                .attr("ry", boxRadius)
            groupIndex++;
        }
    }

    vis.selectAll('.ride-box')
        .on("mouseover", function(d) {
            console.log(d.endStation)
            var thePageX = d3.event.pageX;
            var thePageY = d3.event.pageY;
            var stationName1 = "";
            var stationName2 = "";
            getNameForStation(d.startStation).then(function(stationName1) {
                getNameForStation(d.endStation).then(function(stationName2) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    var dateStamp = new Date(d.startTime)
                    var tipStartDate = monthNames[dateStamp.getMonth()] + ' ' + dateStamp.getDate() + ', 2016'
                    var tipStartTime = dateStamp.getHours() + ':' + dateStamp.getMinutes()
                    var minutes = Math.floor(d.duration / 60);
                    var seconds = d.duration - minutes * 60;
                    var tipDuration = minutes + ':' + str_pad_left(seconds, '0', 2)
                    if (d.gender == 1) {
                        var tipGender = 'Male'
                    } else if (d.gender == 2) {
                        var tipGender = 'Female'
                    } else {
                        var tipGender = 'not available'
                    }


                    div.html("<div class='tip-title'>Ride Details</div><strong>Date:</strong> " + tipStartDate + "<br/><strong>Start Time:</strong> " + tipStartTime + "<br/><strong>Age:</strong> " + d.age + '<br/><strong>Duration:</strong> ' + tipDuration + '<br/><strong>Start Station Name:</strong> ' + stationName1 + '<br/><strong>End Station Name:</strong> ' + stationName2 + '<br/><strong>Gender:</strong> ' + tipGender)
                        .style("left", (thePageX) + "px")
                        .style("top", (thePageY - 28) + "px");
                })
            })

        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function plotDataByMonth(sortedData, customerData, isInit) {
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    xSpacing = widthAddition;
    var axisBoxWidth = (numSegments * boxWidth) + ((numSegments - 1) * boxSpacing);
    var totalAxisWidth = (axisBoxWidth * validMonths) + (boxSpacing * 10);

    // AXIS DEFINITION
    vis.append('g')
        .attr('class', 'month-axis')
        .selectAll('body')
        .data([0, 1, 2, 3, 4, 5, 6, 7])
        .enter()
        .append('rect')
        .attr('x', function(d, i) {
            return (xSpacing - 1) + ((i + 1) * boxSpacing) + (i * axisBoxWidth) + 2
        })
        .attr('y', ySpacing + 6)
        .attr('height', axisHeight)
        .attr('width', axisBoxWidth)
        .attr('stroke', '#fafafa')
        .style('opacity', 0)
        .transition().duration(axisAnimationDuration).style("opacity", 1);

    vis.append('g')
        .attr('class', 'month-axis-label')
        .selectAll('body')
        .data(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'])
        .enter()
        .append('text')
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return ((xSpacing - 2) + ((i + 1) * boxSpacing) + (i * axisBoxWidth)) + (axisBoxWidth / 2)
        })
        .attr('y', ySpacing + 20)
        .attr('height', 25)
        .attr('width', axisBoxWidth)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .attr('class', 'bikeView-year-label')
        .style('opacity', 0)
        .transition().duration(axisAnimationDuration).style("opacity", 1);

    vis.selectAll('.age-axis')
        .transition().duration(axisAnimationDuration).style("opacity", 0);

    vis.selectAll('.age-axis-label')
        .transition().duration(axisAnimationDuration).style("opacity", 0);

    // SUBSCRIBER
    for (month = 0; month < validMonths; month++) {
        var svg = d3.select('svg');
        if (sortedData[month].values !== undefined) {
            for (seg = 0; seg < numSegments; seg++) {
                if (sortedData[month].values[seg].values !== undefined) {
                    // Gender Dist
                    var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1

                    if (isInit == 1) {
                        vis.append('g')
                            .attr('class', 'case-group')
                            .selectAll('body')
                            .data(sortedData[month].values[seg].values)
                            .enter()
                            .append('rect')
                            .transition().duration(fwooshAnimDuration)
                            .ease(fwooshAnimType)
                            .delay(function(d, j) {
                                return j * delayTime
                            })
                            .attr('x', xLoc) // circle -> cx
                            .attr('y', function(d, j) { // circle -> cy
                                return ySpacing - (j * boxHeightMultipler);
                            })
                            .attr('height', boxHeight) // circle -> r -> boxSize/2
                            .attr('width', boxWidth)
                            .attr("class", function(d, i) {
                                if (d.gender == 1) {
                                    var genderClass = 'case-male';
                                } else if (d.gender == 2) {
                                    var genderClass = 'case-female';
                                } else {
                                    var genderClass = 'case-genderUnknown';
                                }

                                var rectClass = 'month' + d.month + '-sub segment' + d.segment + '-sub  age' + d.age + ' month-group' + d.segmentIndex + '-sub';

                                return 'ride-box ' + rectClass + ' ' + genderClass
                            })
                            .attr("rx", boxRadius)
                            .attr("ry", boxRadius);
                    } else {
                        // vis.selectAll('.month-group' + columnIndex + '-sub')
                        theIndex = (numSegments * month) + seg
                        vis.selectAll('.month-group' + theIndex + '-sub')
                            .data(sortedData[month].values[seg].values)
                            // .enter()
                            // .append('rect')
                            .transition().duration(fwooshAnimDuration)
                            .ease(fwooshAnimType)
                            .delay(function(d, j) {
                                return j * delayTime
                            })
                            .attr('x', xLoc) // circle -> cx
                            .attr('y', function(d, j) { // circle -> cy
                                return ySpacing - (j * boxHeightMultipler);
                            })
                            .attr('height', boxHeight) // circle -> r -> boxSize/2
                            .attr('width', boxWidth)
                            .attr("class", function(d, i) {
                                if (d.gender == 1) {
                                    var genderClass = 'case-male';
                                } else if (d.gender == 2) {
                                    var genderClass = 'case-female';
                                } else {
                                    var genderClass = 'case-genderUnknown';
                                }

                                //  var columnIndex = (5*month) + seg
                                //  console.log('dex: ' + columnIndex)
                                var rectClass = 'month' + month + '-sub segment' + seg + '-sub age' + d.age + ' month-group' + theIndex + '-sub';


                                return 'ride-box ' + rectClass + ' ' + genderClass
                            })
                            .attr("rx", boxRadius)
                            .attr("ry", boxRadius);
                    }
                }
            }
        }
    }

    // Customers
    if (isInit == 1) {
        for (month = 0; month < validMonths; month++) {
            var svg = d3.select('svg');
            if (customerData[month].values !== undefined) {
                for (seg = 0; seg < numSegments; seg++) {
                    if (customerData[month].values[seg].values !== undefined) {
                        console.log('hello')
                            // Gender Dist
                        var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1
                        vis.append('g')
                            .attr('class', 'case-group')
                            .selectAll('body')
                            .data(customerData[month].values[seg].values)
                            .enter()
                            .append('rect')
                            .transition().duration(fwooshAnimDuration)
                            .ease(fwooshAnimType)
                            .delay(function(d, j) {
                                return j * delayTime
                            })
                            .attr('x', xLoc) // circle -> cx
                            .attr('y', function(d, j) { // circle -> cy
                                return ySpacing + 30 + (j * boxHeightMultipler);
                            })
                            .attr('height', boxHeight) // circle -> r -> boxSize/2
                            .attr('width', boxWidth)
                            .attr("class", function(d, i) {
                                if (d.gender == 1) {
                                    var genderClass = 'case-male';
                                } else if (d.gender == 2) {
                                    var genderClass = 'case-female';
                                } else {
                                    var genderClass = 'case-genderUnknown';
                                }

                                theIndex = (numSegments * month) + seg
                                var rectClass = 'month' + month + '-cust segment' + seg + '-cust age' + d.age + ' month-group' + theIndex + '-cust cust-box';

                                return 'ride-box ' + rectClass + ' ' + genderClass
                            })
                            .attr("rx", boxRadius)
                            .attr("ry", boxRadius)
                    }
                }
            }
        }
    } else {
        for (month = 0; month < validMonths; month++) {
            var svg = d3.select('svg');
            if (customerData[month].values !== undefined) {
                for (seg = 0; seg < numSegments; seg++) {
                    if (customerData[month].values[seg].values !== undefined) {
                        console.log('hello')
                            // Gender Dist
                        var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1

                        theIndex = (numSegments * month) + seg
                        vis.selectAll('.month-group' + theIndex + '-cust')
                            //  .data(customerData[month].values[seg].values)
                            .transition().duration(fwooshAnimDuration)
                            .ease(fwooshAnimType)
                            .attr('x', xLoc) // circle -> cx
                            .attr('y', function(d, j) { // circle -> cy
                                return ySpacing + 27 + (j * boxHeightMultipler);
                            })
                            .style("opacity", 1)
                            .attr('height', boxHeight) // circle -> r -> boxSize/2
                            .attr('width', boxWidth)
                            .attr("class", function(d, i) {
                                if (d.gender == 1) {
                                    var genderClass = 'case-male';
                                } else if (d.gender == 2) {
                                    var genderClass = 'case-female';
                                } else {
                                    var genderClass = 'case-genderUnknown';
                                }

                                var theIndex = (numSegments * month) + seg
                                var rectClass = 'month' + month + '-cust segment' + seg + '-cust age' + d.age + ' month-group' + theIndex + '-cust cust-box';

                                return 'ride-box ' + rectClass + ' ' + genderClass
                            })
                            .attr("rx", boxRadius)
                            .attr("ry", boxRadius)
                    }
                }
            }
        }
    }
    setTimeout(function() {
        vis.selectAll('.ride-box')
            .on("mouseover", function(d) {
                console.log(d.endStation)
                var thePageX = d3.event.pageX;
                var thePageY = d3.event.pageY;
                var stationName1 = "";
                var stationName2 = "";
                getNameForStation(d.startStation).then(function(stationName1) {
                    getNameForStation(d.endStation).then(function(stationName2) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        var dateStamp = new Date(d.startTime)
                        var tipStartDate = monthNames[dateStamp.getMonth()] + ' ' + dateStamp.getDate() + ', 2016'
                        var tipStartTime = dateStamp.getHours() + ':' + dateStamp.getMinutes()
                        var minutes = Math.floor(d.duration / 60);
                        var seconds = d.duration - minutes * 60;
                        var tipDuration = minutes + ':' + str_pad_left(seconds, '0', 2)
                        if (d.gender == 1) {
                            var tipGender = 'Male'
                        } else if (d.gender == 2) {
                            var tipGender = 'Female'
                        } else {
                            var tipGender = 'not available'
                        }


                        div.html("<div class='tip-title'>Ride Details</div><strong>Date:</strong> " + tipStartDate + "<br/><strong>Start Time:</strong> " + tipStartTime + "<br/><strong>Age:</strong> " + d.age + '<br/><strong>Duration:</strong> ' + tipDuration + '<br/><strong>Start Station Name:</strong> ' + stationName1 + '<br/><strong>End Station Name:</strong> ' + stationName2 + '<br/><strong>Gender:</strong> ' + tipGender)
                            .style("left", (thePageX) + "px")
                            .style("top", (thePageY - 28) + "px");
                    })
                })

            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }, 1000)
}

function sortByGender() {
    var theTooltipDiv = document.getElementsByClassName('tooltip')
    if (theTooltipDiv[0] !== undefined) {
        theTooltipDiv[0].parentNode.removeChild(theTooltipDiv[0])
    }
    if (organizerType == 'month') {
        for (m = 0; m < 80; m++) {
            vis.selectAll('.month-group' + m + '-sub').sort(function(a, b) {
                    return d3.ascending(a.gender, b.gender)
                })
                .transition().duration(shuffleAnimDuration)
                .ease(shuffleAnimType)
                .delay(function(d, j) {
                    return j * delayTime
                })
                .attr('y', function(d, j) {
                    return ySpacing - (j * boxHeightMultipler);
                })
        }
    } else if (organizerType == 'age') {
        for (m = 0; m < 80; m++) { // what is 75?
            vis.selectAll('.age-group' + m).sort(function(a, b) {
                    return d3.ascending(a.gender, b.gender)
                })
                .transition().duration(shuffleAnimDuration)
                .ease(shuffleAnimType)
                .delay(function(d, j) {
                    return j * delayTime
                })
                .attr('y', function(d, j) {
                    return ySpacing - (j * boxHeightMultipler);
                })
        }
    }
    var genderSortButton = document.getElementById('genderBtn')
    genderSortButton.classList.add("active");
    var timeSortButton = document.getElementById('timeBtn')
    timeSortButton.classList.remove("active");
}

function sortByTime() {
    var theTooltipDiv = document.getElementsByClassName('tooltip')
    if (theTooltipDiv[0] !== undefined) {
        theTooltipDiv[0].parentNode.removeChild(theTooltipDiv[0])
    }
    if (organizerType == 'month') {
        for (m = 0; m < 80; m++) {
            vis.selectAll('.month-group' + m + '-sub').sort(function(a, b) {
                    return d3.ascending(a.startTime, b.startTime)
                })
                .transition().duration(shuffleAnimDuration)
                .ease(shuffleAnimType)
                .delay(function(d, j) {
                    return j * delayTime
                })
                .attr('y', function(d, j) {
                    return ySpacing - (j * boxHeightMultipler);
                })
        }
    } else if (organizerType == 'age') {
        for (m = 0; m < 80; m++) { // what is 75?
            vis.selectAll('.age-group' + m).sort(function(a, b) {
                    return d3.ascending(a.startTime, b.startTime)
                })
                .transition().duration(shuffleAnimDuration)
                .ease(shuffleAnimType)
                .delay(function(d, j) {
                    return j * delayTime
                })
                .attr('y', function(d, j) {
                    return ySpacing - (j * boxHeightMultipler);
                })
        }
    }
    var genderSortButton = document.getElementById('genderBtn')
    genderSortButton.classList.remove("active");
    var timeSortButton = document.getElementById('timeBtn')
    timeSortButton.classList.add("active");
}

function getRandomBikeNumber() {
    var bikeObject = new Object()
    bikeObject = {
        "19125": true,
        "20778": true,
        "25285": true,
        "17079": true,
        "21999": true,
        "20323": true,
        "16997": true,
        "14779": true,
        "22578": true,
        "15822": true,
        "15469": true,
        "21299": true,
        "16065": true,
        "21327": true,
        "25962": true,
        "23927": true,
        "20077": true,
        "21526": true,
        "22064": true,
        "17254": true,
        "24282": true,
        "21080": true,
        "16217": true,
        "25067": true,
        "14820": true,
        "22219": true,
        "25912": true,
        "18703": true,
        "18482": true,
        "23647": true,
        "15771": true,
        "23398": true,
        "23854": true,
        "18388": true,
        "16846": true,
        "16544": true,
        "22818": true,
        "22285": true,
        "25112": true,
        "16939": true,
        "18716": true,
        "24800": true,
        "14548": true,
        "18434": true,
        "16074": true,
        "23268": true,
        "25832": true,
        "19444": true,
        "18251": true,
        "24658": true,
        "25761": true,
        "17547": true,
        "22545": true,
        "15314": true,
        "26004": true,
        "16353": true,
        "18779": true,
        "26456": true,
        "22988": true,
        "14947": true,
        "22874": true,
        "26079": true,
        "16127": true,
        "22274": true,
        "19344": true,
        "21475": true,
        "23309": true,
        "16625": true,
        "16984": true,
        "23469": true,
        "23985": true,
        "21145": true,
        "21703": true,
        "15448": true,
        "23735": true,
        "16657": true,
        "25011": true,
        "22899": true,
        "16513": true,
        "26356": true,
        "18966": true,
        "25790": true,
        "15496": true,
        "23407": true,
        "24636": true,
        "17750": true,
        "23488": true,
        "18417": true,
        "25187": true,
        "23934": true,
        "19489": true,
        "16331": true,
        "19632": true,
        "19016": true,
        "22422": true,
        "26446": true,
        "15848": true,
        "23826": true,
        "26784": true,
        "16562": true,
        "22769": true,
        "17392": true,
        "22585": true,
        "22161": true,
        "25499": true,
        "16201": true,
        "19819": true,
        "24236": true,
        "17766": true,
        "25616": true,
        "15967": true,
        "25151": true,
        "16681": true,
        "22977": true,
        "23369": true,
        "20187": true,
        "24303": true,
        "20228": true,
        "26396": true,
        "23134": true,
        "17440": true,
        "26815": true,
        "19207": true,
        "23687": true,
        "25973": true,
        "22252": true,
        "17347": true,
        "17947": true,
        "24247": true,
        "23724": true,
        "25336": true,
        "18140": true,
        "22659": true,
        "23382": true,
        "26606": true,
        "15108": true,
        "24217": true,
        "19804": true,
        "18800": true,
        "25144": true,
        "19647": true,
        "17539": true,
        "26725": true,
        "25751": true,
        "23713": true,
        "22150": true,
        "21577": true,
        "16379": true,
        "26409": true,
        "17466": true,
        "23754": true,
        "24863": true,
        "19591": true,
        "25078": true,
        "22198": true,
        "21085": true,
        "15787": true,
        "16307": true,
        "25890": true,
        "23596": true,
        "17987": true,
        "22411": true,
        "19236": true,
        "18997": true,
        "24463": true,
        "24822": true,
        "21469": true,
        "18746": true,
        "15877": true,
        "17616": true,
        "25971": true,
        "16294": true,
        "19046": true,
        "20217": true,
        "23040": true,
        "17210": true,
        "20299": true,
        "25229": true,
        "23707": true,
        "18579": true,
        "21096": true,
        "23354": true,
        "18011": true,
        "15520": true,
        "26046": true,
        "16577": true,
        "24643": true,
        "16511": true,
        "15155": true,
        "22029": true,
        "25775": true,
        "24597": true,
        "20598": true,
        "18489": true,
        "26934": true,
        "19825": true,
        "19621": true,
        "22859": true,
        "25004": true,
        "22314": true,
        "22346": true,
        "18324": true,
        "15627": true,
        "14624": true,
        "19308": true,
        "16410": true,
        "25393": true,
        "16018": true,
        "17470": true,
        "25656": true,
        "18840": true,
        "20558": true,
        "23123": true,
        "22905": true,
        "20793": true,
        "22188": true,
        "15405": true,
        "17682": true,
        "17873": true,
        "24939": true,
        "16763": true,
        "24130": true,
        "26693": true,
        "20690": true,
        "18097": true,
        "23054": true,
        "19404": true,
        "25825": true,
        "24736": true,
        "26028": true,
        "22061": true,
        "16528": true,
        "22638": true,
        "21659": true,
        "25545": true,
        "16001": true,
        "21566": true,
        "15575": true,
        "22679": true,
        "18222": true,
        "25982": true,
        "26367": true,
        "18952": true,
        "23397": true,
        "22199": true,
        "19658": true,
        "25472": true,
        "21915": true,
        "20803": true,
        "19199": true,
        "15651": true,
        "23189": true,
        "17593": true,
        "26037": true,
        "19580": true,
        "20863": true,
        "15415": true,
        "26614": true,
        "26564": true,
        "25451": true,
        "21398": true,
        "20620": true,
        "21648": true,
        "16111": true
    }

    var myArray = Object.keys(bikeObject)
    return myArray[Math.floor(Math.random() * myArray.length)];
}

function getRandomStationNumber() {
    var stationObject = new Object()

    stationObject = {
        "515": true,
        "3180": true,
        "3014": true,
        "3379": true,
        "507": true,
        "3419": true,
        "455": true,
        "388": true,
        "310": true,
        "444": true,
        "120": true,
        "302": true,
        "153": true,
        "3292": true,
        "335": true,
        "2003": true,
        "458": true,
        "3160": true,
        "147": true,
        "3047": true,
        "436": true,
        "3304": true,
        "3094": true,
        "223": true,
        "3396": true,
        "216": true,
        "3266": true,
        "3083": true,
        "400": true,
        "3106": true,
        "411": true,
        "3222": true,
        "3171": true,
        "307": true,
        "3058": true,
        "501": true,
        "519": true,
        "3159": true,
        "276": true,
        "164": true,
        "3230": true,
        "3326": true,
        "3408": true,
        "3069": true,
        "3119": true,
        "526": true,
        "3172": true,
        "447": true,
        "461": true,
        "324": true,
        "332": true,
        "313": true,
        "3315": true,
        "362": true,
        "265": true,
        "3284": true,
        "3330": true,
        "433": true,
        "321": true,
        "3143": true,
        "3340": true,
        "537": true,
        "3300": true,
        "128": true,
        "343": true,
        "523": true,
        "3077": true,
        "421": true,
        "450": true,
        "415": true,
        "3411": true,
        "534": true,
        "3165": true,
        "3054": true,
        "3244": true,
        "418": true,
        "373": true,
        "3182": true,
        "469": true,
        "3076": true,
        "3234": true,
        "3154": true,
        "2002": true,
        "3065": true,
        "3115": true,
        "3382": true,
        "3311": true,
        "284": true,
        "3132": true,
        "3097": true,
        "504": true,
        "3422": true,
        "475": true,
        "3405": true,
        "3368": true,
        "295": true,
        "320": true,
        "3137": true,
        "481": true,
        "3059": true,
        "486": true,
        "3086": true,
        "3353": true,
        "396": true,
        "3238": true,
        "3357": true,
        "3148": true,
        "3126": true,
        "3048": true,
        "3121": true,
        "236": true,
        "385": true,
        "3288": true,
        "3161": true,
        "3427": true,
        "497": true,
        "492": true,
        "3111": true,
        "346": true,
        "3150": true,
        "280": true,
        "3400": true,
        "454": true,
        "3416": true,
        "3385": true,
        "3249": true,
        "466": true,
        "351": true,
        "3176": true,
        "540": true,
        "407": true,
        "3295": true,
        "3043": true,
        "3255": true,
        "291": true,
        "262": true,
        "470": true,
        "298": true,
        "3363": true,
        "3308": true,
        "250": true,
        "399": true,
        "392": true,
        "3229": true,
        "329": true,
        "3036": true,
        "212": true,
        "512": true,
        "393": true,
        "2022": true
    }

    var myArray = Object.keys(stationObject)
    return myArray[Math.floor(Math.random() * myArray.length)];
}

function getNameForStation(stationID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stationName = "";
    return ref.child('stations/' + stationID + '/details/').once("value").then(function(snapshot) {
        var stationDetailObject = snapshot.val();
        var stationName = stationDetailObject.name
        return stationName
    }).then(function(stationName) {
        return stationName;
    });
}

function getBirthStationForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var birthStation = "";
    var birthDate = "";
    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().limitToFirst(1).once("value").then(function(snapshot) {

        snapshot.forEach(function(childSnapshot) {

            var dataObject = childSnapshot.val();
            console.log("see this -" + dataObject.startStation);

            if (birthStation == "") {
                birthStation = dataObject.startStation;
            }

            if (birthDate == "") {
                birthDate = dataObject.startTime
            }

        });

    }).then(function() {
        return [birthStation, birthDate];
    });
};

function str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}


////////////////////////////////////////////////////////////////////////////////


function loadTop50Stations() {

    getPopularStationIDsForBike(bikeIDTEST).then(function(stationsList) {

        //console.log("THIS PART IS FOR ALEX TO SEE.....")
        //console.log("popular station IDs - " + stationsList);

        for (var i = 0; i < stationsList.length; i++) {
            if (i == (stationsList.length - 1)) {
                getStationForID(stationsList[i]).then(function(theStation) {
                    top50Stations.push(theStation);

                    //console.log("here are all 50 stations" + JSON.stringify(top50Stations));
                    //console.log("heres' what getMarkers returns " + JSON.stringify(getMarkers(top50Stations)));

                    map.addSource("markers", {
                        "type": "geojson",
                        "data": getMarkers(top50Stations)
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
                    //findImageForCoords(allStations[0].latitude, allStations[0].longitude);
                });

            } else {

                getStationForID(stationsList[i]).then(function(theStation) {
                    top50Stations.push(theStation);
                });

            }

        }

    })
}

function getPopularStationIDsForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");

    var stations = new Array();
    return ref.child('bikes/' + bikeID + '/stations/').orderByValue().limitToFirst(50).once("value").then(function(snapshot) {

        snapshot.forEach(function(childSnapshot) {

            var dataObject = childSnapshot.val();
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
        //console.log("hey - " + JSON.stringify(latitude));

        var dataObject = snapshot.val()

        if (dataObject.latitude) {
            stationObject = dataObject;
        }

    }).then(function() {
        return stationObject;
    });
};


///////////////////////////////////////////////////////////////////////////////
// CREATE MARKERS FOR MAPBOX FROM FIREBASE OBJECTS


function getMarkers(theStations) {

    var fullFeaturesString = new String();

    theStations.forEach(function(oneStation, idx, array) {

        console.log("FIND STATION ID " + oneStation);
        console.log("FIND STATION ID " + JSON.stringify(oneStation));


        //create JSON text for each station marker
        if (idx == array.length - 1) { // on last item, don't add a commma
            var middleJSON = '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [' + parseFloat(theStations[idx].longitude) + ', ' + parseFloat(theStations[idx].latitude) + ']}, "properties": {"title": "' + theStations[idx].name + '", "description": "' + theStations[idx].stationNumber + '", "marker-color": "#7947A6", "marker-size": "large", "marker-symbol": "marker", "marker-size": "large"}}'
        } else {
            var middleJSON = '{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [' + parseFloat(theStations[idx].longitude) + ', ' + parseFloat(theStations[idx].latitude) + ']}, "properties": {"title": "' + theStations[idx].name + '", "description": "' + theStations[idx].stationNumber + '", "marker-color": "#7947A6", "marker-size": "large", "marker-symbol": "marker", "marker-size": "large"}},'
        }

        fullFeaturesString = fullFeaturesString.concat(middleJSON);

    });

    var initialJSON = '{ "type": "FeatureCollection", "features": [';
    var middleJSON = fullFeaturesString;
    var endingJSON = '] }';

    var fullJSONObject = JSON.parse(initialJSON + middleJSON + endingJSON);


    return fullJSONObject;

}
