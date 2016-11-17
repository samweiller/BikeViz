// REQUIRES
const firebase = require('firebase');
const fs = require('fs');
const csv = require('fast-csv');

firebase.initializeApp({
    serviceAccount: "citiviz3-83044-firebase-adminsdk-cygq5-6f6cd020de.json",
    databaseURL: "https://citiviz3-83044.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref("/");

var bikeRef = ref.child("bikes"); // <-- BIKE SCHEMA BASE
var stationRef = ref.child('stations'); // <-- STATION SCHEMA BASE
var masterBikeRef = ref.child('masterBikes');

// These are here just in case. The functions are taken care of in 'killSwitch.js'.
// ref.child('invalidRideCount').set(0);
// ref.child('totalRideCount').set(0);
// ref.child('duplicateRideCount').set(0);

// Open up a data stream for a csv
// TODO: Either have this iterate through files or be dynamic (or both)
var stream = fs.createReadStream('data/01Jan2016.csv');

csv
    .fromStream(stream, {
        headers: true
    }) // headers: true creates objects instead of arrays

    .validate(function(ride, next) { // Read each line (ride)
            console.time('FullTime')
            var bikeID = ride['bikeid'];
            var stationID = ride['start station id'];

            var timestamp = createTimeStampFrom(ride['starttime'], bikeID)

            rideObject = {
                startTime: ride['starttime'],
                duration: ride['tripduration'],
                startStation: ride['start station id'],
                endStation: ride['end station id'],
                user: {
                    gender: ride['gender'],
                    birthYear: ride['birth year'],
                    type: ride['usertype']
                }
            };

            stationObject = {
                stationNumber: ride['start station id'],
                name: ride['start station name'],
                latitude: ride['start station latitude'],
                longitude: ride['start station longitude']
            };

            var isValidRide = 1; // Rides are valid until proven otherwise

            if (ride['gender'] == 0) { // A ride can be invalid if the gender is 0
                isValidRide = 0;
            }

            if (Number(ride['birth year']) < 1) { // A ride can be invalid if the birth year is less than 1
                isValidRide = 0;
            }

            // Checking if the ride ID already exists`
            // console.time('CheckForBike')
            if (isValidRide == 1) {
                masterBikeRef.child(bikeID).set(1).then(function(data) {

                  //   console.time('TotalBikes')
                  //   masterBikeRef.once('value').then(function(snapshot) {
                  //       ref.child('totalNumBikes').set(snapshot.numChildren());
                  //   });
                  //   console.timeEnd('TotalBikes')

                    // STATION PROCESSING
                    stationRef.child(stationID + '/details').set(stationObject);
                    stationRef.child(stationID + '/rides/' + timestamp).set(bikeID);

                  //   console.time('SummaryOps')
                        // BIKE PROCESSING
                    updateSummaryForBike(bikeID, rideObject)
                  //   console.timeEnd('SummaryOps')

                  //   console.time('RideOps')
                    createNewRideForBike(bikeID, rideObject, timestamp).then(

                        // BIKE PROCESSING

                        function(data) {
                            ref.child('totalRideCount').transaction(function(currentRank) {

                                return currentRank + 1;
                            });

                });
                console.timeEnd('FullTime');
                next();
               //  console.timeEnd('RideOps')
            });
    }
else if (isValidRide == -1) {
    ref.child('duplicateRideCount').transaction(function(currentRank) {
        return currentRank + 1;
    });
    next();
} else {
    ref.child('invalidRideCount').transaction(function(currentRank) {
        return currentRank + 1;
    });
    next();
}
//   console.timeEnd('FullTime')
//   next();
});

// /////////////////////////////////////////////////////////////////
// // WORKING CODE - Pull Data Down
// countryRef.child(theParsedCountry).child('gold').once("value")
//     .then(function(dataSnapshot) {
//         var goldToReport = dataSnapshot.val()
//     });
//
// // SAMPLE
// schemaBase.child(childID).child(childID).once("value")
//    .then(function(dataSnapshot) {
//       var childValue = dataSnapshot.val();
//    })
// /////////////////////////////////////////////////////////////////

// //////////////////////////////////////////////////////////////////
// // WORKING CODE - Push Data Up
// // HotSwap Ex
// firebase.database().ref().child('counter').transaction(function(currentRank) {
//                         return currentRank + 1;
//                     });
// //////////////////////////////////////////////////////////////////

function createTimeStampFrom(dateTime, bikeID) {
    var monthDay = dateTime.split('/');
    var yearTime = monthDay[2].split(' ');
    var hourMin = yearTime[1].split(':');

    if (monthDay[0].length == 1) {
        var theMonth = '0' + monthDay[0];
    } else {
        theMonth = monthDay[0];
    }

    if (monthDay[1].length == 1) {
        var theDay = '0' + monthDay[1];
    } else {
        var theDay = monthDay[1];
    }

    var theYear = yearTime[0];

    if (hourMin[0].length == 1) {
        var theHour = '0' + hourMin[0];
    } else {
        var theHour = hourMin[0];
    }

    var theMin = hourMin[1];

    return String(theYear + theMonth + theDay + '_' + theHour + theMin)
}

function createNewRideForBike(bikeID, rideObject, timestamp) {
    // Ride Schema
    //  var rideObject = {
    //    duration: Number,
    //    startTime: String,
    //    startStation: Number,
    //    endStation: Number,
    //    user: [{
    //       type: String,
    //       birthYear: Number,
    //       gender: Number
    //    }]
    //   };
    //  console.log('ride for bike')

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/bikes/' + bikeID + '/rides/' + timestamp] = rideObject;

    //  console.log('FULLDECK: Created new ride on bike ' + bikeID + '.');

    return firebase.database().ref().update(updates);
}

function updateSummaryForBike(bikeID, rideObject) {
    /*
    SUMMARY SCHEMA

    bike.summary:

    num_rides: Count
    avg_duration: Avg
    avg_gender: (1-2)
    avg_type: (1-2)
    */

    return bikeRef.child(bikeID).child('summary').once('value').then(function(snapshot) {
        var currentRides = snapshot.child('num_rides').val()
        var newAverageDuration = (
                Number(snapshot.child('avg_duration').val() * currentRides) + Number(rideObject.duration)
            ) /
            Number(currentRides + 1);

        var newAvgBirthYear = (
                Number(snapshot.child('avg_birth_year').val() * currentRides) + Number(rideObject.user.birthYear)
            ) /
            Number(currentRides + 1);

        var newPercFemale = snapshot.child('percent_female').val();
        if (rideObject.user.gender == 0) {
            var newPercFemale = snapshot.child('percent_female').val();
        } else if (rideObject.user.gender == 1) { // male
            var newPercFemale = Number(currentRides * snapshot.child('percent_female').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.gender == 2) {
            var newPercFemale = Number(
                    Number(currentRides * snapshot.child('percent_female').val()) + 1) /
                Number(currentRides + 1);
        }

        var newPercSubscriber = snapshot.child('percent_subscriber').val();
        if (rideObject.user.type == "Customer") { // male
            var newPercSubscriber = Number(currentRides + snapshot.child('percent_subscriber').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.type == "Subscriber") {
            var newPercSubscriber = Number(
                    Number(currentRides * snapshot.child('percent_subscriber').val()) + 1) /
                Number(currentRides + 1);
        }

        var summaryObject = {
            num_rides: currentRides + 1,
            avg_duration: newAverageDuration,
            avg_birth_year: newAvgBirthYear,
            percent_female: newPercFemale,
            percent_subscriber: newPercSubscriber
        }

        var updates = {};
        updates['/bikes/' + bikeID + '/summary'] = summaryObject;

        firebase.database().ref().update(updates);
    });
}

function updateSummaryForStation(stationID, rideObject) {
    /*
    SUMMARY SCHEMA

    bike.summary:

    num_rides: Count
    avg_duration: Avg
    avg_gender: (1-2)
    avg_type: (1-2)
    */

    return stationRef.child(stationID + '/summary').once('value').then(function(snapshot) {
        var currentRides = snapshot.child('num_rides').val()
        var newAverageDuration = (
                Number(snapshot.child('avg_duration').val() * currentRides) + Number(rideObject.duration)
            ) /
            Number(currentRides + 1);

        var newAvgBirthYear = (
                Number(snapshot.child('avg_birth_year').val() * currentRides) + Number(rideObject.user.birthYear)
            ) /
            Number(currentRides + 1);

        var newPercFemale = snapshot.child('percent_female').val();
        if (rideObject.user.gender == 0) {
            var newPercFemale = snapshot.child('percent_female').val();
        } else if (rideObject.user.gender == 1) { // male
            var newPercFemale = Number(currentRides * snapshot.child('percent_female').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.gender == 2) {
            var newPercFemale = Number(
                    Number(currentRides * snapshot.child('percent_female').val()) + 1) /
                Number(currentRides + 1);
        }

        var newPercSubscriber = snapshot.child('percent_subscriber').val();
        if (rideObject.user.type == "Customer") { // male
            var newPercSubscriber = Number(currentRides + snapshot.child('percent_subscriber').val()) /
                Number(currentRides + 1);
        } else if (rideObject.user.type == "Subscriber") {
            var newPercSubscriber = Number(
                    Number(currentRides * snapshot.child('percent_subscriber').val()) + 1) /
                Number(currentRides + 1);
        }

        var summaryObject = {
            num_rides: currentRides + 1,
            avg_duration: newAverageDuration,
            avg_birth_year: newAvgBirthYear,
            percent_female: newPercFemale,
            percent_subscriber: newPercSubscriber
        }

        var updates = {};
        updates['/stations/' + stationID + '/summary'] = summaryObject;

        firebase.database().ref().update(updates);
    });
}
