const firebase = require('firebase');

firebase.initializeApp({
    serviceAccount: "./citiviz-914fd-firebase-adminsdk-al22h-0d51e5b384.json",
    databaseURL: "https://citiviz-914fd.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref("/");

// OLD DEMO CODE
var bikeRef = ref.child("bikes"); // <-- SCHEMA BASE
var masterBikeRef = ref.child('masterBikes')

masterBikeRef.once('value').then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
        var bikeID = childSnapshot.key;
      //   console.log(bikeID)

        // Birth Certificate
        bikeRef.child(bikeID).child('rides').orderByValue().limitToFirst(1).on("value", function(snapshot) {
            var birthRideObject = snapshot.val();
            var uniqueRideID = Object.keys(birthRideObject);
            var birthStation = birthRideObject[uniqueRideID]['startStation'];
            var birthDate = birthRideObject[uniqueRideID]['startTime'];

            var birthCertificate = {
                bikeID: bikeID,
                birthplace: birthStation,
                birthdate: birthDate
            }

            var updates = {};
            updates['/bikes/' + bikeID + '/birth'] = birthCertificate;

            console.log('Created birth certificate for bike ' + bikeID + '.');

            return firebase.database().ref().update(updates);
        })

        bikeRef.child(bikeID).child('rides').orderByValue().limitToLast(1).on("value", function(snapshot) {
            var deathRideObject = snapshot.val();
            var uniqueRideID = Object.keys(deathRideObject);
            var deathStation = deathRideObject[uniqueRideID]['endStation'];
            var deathDate = deathRideObject[uniqueRideID]['startTime'];

            var deathCertificate = {
                bikeID: bikeID,
                deathplace: deathStation,
                deathdate: deathDate
            }

            var updates = {};
            updates['/bikes/' + bikeID + '/death'] = deathCertificate;

            console.log('Created death certificate for bike ' + bikeID + '.');

            return firebase.database().ref().update(updates);
        });
    })
})
