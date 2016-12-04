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
var ySpacing = 430;

var theBikeID = getRandomBikeNumber();
console.log(theBikeID)

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
                           } else if (d.gender == 2) {
                              var genderClass = 'case-female';
                           } else {
                              var genderClass = 'case-genderUnknown';
                           }

                            var rectClass = 'month' + month + ' segment' + seg + ' age' + d.age;

                            return 'ride-box ' + rectClass + ' ' + genderClass
                        })
                }
            }
        }
    }

    // Customers
    for (month = 0; month < validMonths; month++) {
        var svg = d3.select('svg');
        if (customerData[month].values !== undefined) {
            for (seg = 0; seg < numSegments; seg++) {
                if (customerData[month].values[seg].values !== undefined) {
                    console.log('hello')
                        // Gender Dist
                    var xLoc = (((numSegments * month) + seg) * boxWidthMultipler) + xSpacing + 1
                    vis.append('g')
                        .selectAll('body')
                        .data(customerData[month].values[seg].values)
                        .enter()
                        .append('rect')
                        .attr('x', xLoc) // circle -> cx
                        .attr('y', function(d, j) { // circle -> cy
                            return ySpacing + 27 + (j * boxHeightMultipler);
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

                            var rectClass = 'month' + month + ' segment' + seg + ' age' + d.age;

                            return 'ride-box ' + rectClass + ' ' + genderClass
                        })
                }
            }
        }
    }
}

function getRandomBikeNumber() {
   var bikeObject = new Object()
   bikeObject = {
     "19125" : true,
     "20778" : true,
     "25285" : true,
     "17079" : true,
     "21999" : true,
     "20323" : true,
     "16997" : true,
     "14779" : true,
     "22578" : true,
     "15822" : true,
     "15469" : true,
     "21299" : true,
     "16065" : true,
     "21327" : true,
     "25962" : true,
     "23927" : true,
     "20077" : true,
     "21526" : true,
     "22064" : true,
     "17254" : true,
     "24282" : true,
     "21080" : true,
     "16217" : true,
     "25067" : true,
     "14820" : true,
     "22219" : true,
     "25912" : true,
     "18703" : true,
     "18482" : true,
     "23647" : true,
     "15771" : true,
     "23398" : true,
     "23854" : true,
     "18388" : true,
     "16846" : true,
     "16544" : true,
     "22818" : true,
     "22285" : true,
     "25112" : true,
     "16939" : true,
     "18716" : true,
     "24800" : true,
     "14548" : true,
     "18434" : true,
     "16074" : true,
     "23268" : true,
     "25832" : true,
     "19444" : true,
     "18251" : true,
     "24658" : true,
     "25761" : true,
     "17547" : true,
     "22545" : true,
     "15314" : true,
     "26004" : true,
     "16353" : true,
     "18779" : true,
     "26456" : true,
     "22988" : true,
     "14947" : true,
     "22874" : true,
     "26079" : true,
     "16127" : true,
     "22274" : true,
     "19344" : true,
     "21475" : true,
     "23309" : true,
     "16625" : true,
     "16984" : true,
     "23469" : true,
     "23985" : true,
     "21145" : true,
     "21703" : true,
     "15448" : true,
     "23735" : true,
     "16657" : true,
     "25011" : true,
     "22899" : true,
     "16513" : true,
     "26356" : true,
     "18966" : true,
     "25790" : true,
     "15496" : true,
     "23407" : true,
     "24636" : true,
     "17750" : true,
     "23488" : true,
     "18417" : true,
     "25187" : true,
     "23934" : true,
     "19489" : true,
     "16331" : true,
     "19632" : true,
     "19016" : true,
     "22422" : true,
     "26446" : true,
     "15848" : true,
     "23826" : true,
     "26784" : true,
     "16562" : true,
     "22769" : true,
     "17392" : true,
     "22585" : true,
     "22161" : true,
     "25499" : true,
     "16201" : true,
     "19819" : true,
     "24236" : true,
     "17766" : true,
     "25616" : true,
     "15967" : true,
     "25151" : true,
     "16681" : true,
     "22977" : true,
     "23369" : true,
     "20187" : true,
     "24303" : true,
     "20228" : true,
     "26396" : true,
     "23134" : true,
     "17440" : true,
     "26815" : true,
     "19207" : true,
     "23687" : true,
     "25973" : true,
     "22252" : true,
     "17347" : true,
     "17947" : true,
     "24247" : true,
     "23724" : true,
     "25336" : true,
     "18140" : true,
     "22659" : true,
     "23382" : true,
     "26606" : true,
     "15108" : true,
     "24217" : true,
     "19804" : true,
     "18800" : true,
     "25144" : true,
     "19647" : true,
     "17539" : true,
     "26725" : true,
     "25751" : true,
     "23713" : true,
     "22150" : true,
     "21577" : true,
     "16379" : true,
     "26409" : true,
     "17466" : true,
     "23754" : true,
     "24863" : true,
     "19591" : true,
     "25078" : true,
     "22198" : true,
     "21085" : true,
     "15787" : true,
     "16307" : true,
     "25890" : true,
     "23596" : true,
     "17987" : true,
     "22411" : true,
     "19236" : true,
     "18997" : true,
     "24463" : true,
     "24822" : true,
     "21469" : true,
     "18746" : true,
     "15877" : true,
     "17616" : true,
     "25971" : true,
     "16294" : true,
     "19046" : true,
     "20217" : true,
     "23040" : true,
     "17210" : true,
     "20299" : true,
     "25229" : true,
     "23707" : true,
     "18579" : true,
     "21096" : true,
     "23354" : true,
     "18011" : true,
     "15520" : true,
     "26046" : true,
     "16577" : true,
     "24643" : true,
     "16511" : true,
     "15155" : true,
     "22029" : true,
     "25775" : true,
     "24597" : true,
     "20598" : true,
     "18489" : true,
     "26934" : true,
     "19825" : true,
     "19621" : true,
     "22859" : true,
     "25004" : true,
     "22314" : true,
     "22346" : true,
     "18324" : true,
     "15627" : true,
     "14624" : true,
     "19308" : true,
     "16410" : true,
     "25393" : true,
     "16018" : true,
     "17470" : true,
     "25656" : true,
     "18840" : true,
     "20558" : true,
     "23123" : true,
     "22905" : true,
     "20793" : true,
     "22188" : true,
     "15405" : true,
     "17682" : true,
     "17873" : true,
     "24939" : true,
     "16763" : true,
     "24130" : true,
     "26693" : true,
     "20690" : true,
     "18097" : true,
     "23054" : true,
     "19404" : true,
     "25825" : true,
     "24736" : true,
     "26028" : true,
     "22061" : true,
     "16528" : true,
     "22638" : true,
     "21659" : true,
     "25545" : true,
     "16001" : true,
     "21566" : true,
     "15575" : true,
     "22679" : true,
     "18222" : true,
     "25982" : true,
     "26367" : true,
     "18952" : true,
     "23397" : true,
     "22199" : true,
     "19658" : true,
     "25472" : true,
     "21915" : true,
     "20803" : true,
     "19199" : true,
     "15651" : true,
     "23189" : true,
     "17593" : true,
     "26037" : true,
     "19580" : true,
     "20863" : true,
     "15415" : true,
     "26614" : true,
     "26564" : true,
     "25451" : true,
     "21398" : true,
     "20620" : true,
     "21648" : true,
     "16111" : true
  }

  var myArray = Object.keys(bikeObject)
return myArray[Math.floor(Math.random() * myArray.length)];
}
