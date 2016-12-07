// var theBikeID = 23459;
var theBikeID = readCookie("selectedBike");
// console.log("from the cookie" + theBikeID)

var duration   = 500,
    transition = 200;

var donutSize = 100;
var yHeight = "7px";

getRidesForBike(theBikeID).then(function(bikeData) {
   var totalRides = bikeData[4]

   var maleCount = bikeData[0]
   var femaleCount = bikeData[1]
   var totalGender = maleCount + femaleCount
   var malePercentage = Math.round((maleCount/totalGender) * 100)
   var femalePercentage = Math.round((femaleCount/totalGender) * 100)

   var subCount = bikeData[2]
   var custCount = bikeData[3]
   var totalType = subCount + custCount
   var subPercentage = Math.round((subCount/totalType) * 100)
   var custPercentage = Math.round((custCount/totalType) * 100)

   var titleDiv = document.getElementsByClassName('IT-bike-name')
   // var titleText = document.createTextNode('Your bike is number ' + theBikeID + '.')
   // titleDiv[0].appendChild(titleText)
   titleDiv[0].innerHTML = 'Your bike is number <strong>' + theBikeID + '</strong>.'

   var rideCountDiv = document.getElementsByClassName('IT-bike-info')
   // var infoText = document.createTextNode('It has taken ' + totalRides + ' rides in 2016.')
   // rideCountDiv[0].appendChild(infoText)
   rideCountDiv[0].innerHTML = 'It has taken <strong>' + totalRides + '</strong> rides so far in 2016.'

   setTimeout(function(){
   drawDonutChart('.IT-male-perc', malePercentage, donutSize, donutSize, yHeight, 'male-')
   drawDonutChart('.IT-female-perc', femalePercentage, donutSize, donutSize, yHeight, 'female-')

   drawDonutChart('.IT-sub-perc', subPercentage, donutSize, donutSize, yHeight, 'sub-')
   drawDonutChart('.IT-cust-perc', custPercentage, donutSize, donutSize, yHeight, 'cust-')


   var maleDiv = document.getElementsByClassName('IT-male-perc')
   var maleTitleDiv = document.createElement('div')
   var maleTitleText = document.createTextNode('Male Riders')
   maleTitleDiv.appendChild(maleTitleText)
   maleTitleDiv.className = 'donut-title'
   maleDiv[0].append(maleTitleDiv)

   var femaleDiv = document.getElementsByClassName('IT-female-perc')
   var femaleTitleDiv = document.createElement('div')
   var femaleTitleText = document.createTextNode('Female Riders')
   femaleTitleDiv.appendChild(femaleTitleText)
   femaleTitleDiv.className = 'donut-title'
   femaleDiv[0].append(femaleTitleDiv)

   var subDiv = document.getElementsByClassName('IT-sub-perc')
   var subTitleDiv = document.createElement('div')
   var subTitleText = document.createTextNode('Annual Riders')
   subTitleDiv.appendChild(subTitleText)
   subTitleDiv.className = 'donut-title'
   subDiv[0].append(subTitleDiv)

   var custDiv = document.getElementsByClassName('IT-cust-perc')
   var custTitleDiv = document.createElement('div')
   var custTitleText = document.createTextNode('One-Time Riders')
   custTitleDiv.appendChild(custTitleText)
   custTitleDiv.className = 'donut-title'
   custDiv[0].append(custTitleDiv)

}, 4000)
})


function getRidesForBike(bikeID) {
    var db = firebase.database();
    var ref = db.ref("/");
    var fullDataArray = {
        'subscriber': [],
        'customer': []
    }

    var subCount = 0;
    var custCount = 0;
    var maleCount = 0;
    var femaleCount = 0;
    var totalCount = 0;

    return ref.child('bikes/' + bikeID + '/rides/').orderByKey().once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var dataObject = childSnapshot.val()

            if (dataObject.user.type == 'Subscriber') {
               subCount++;
            } else if (dataObject.user.type == 'Customer') {
               custCount++;
            }

            if (dataObject.user.gender == 1) {
               maleCount++;
            } else if (dataObject.user.gender == 2) {
               femaleCount++;
            }

            totalCount++;
        });
    }).then(function() {
        return [maleCount, femaleCount, subCount, custCount, totalCount]
    });
};

function drawDonutChart(element, percent, width, height, text_y, theClass) {
  width = typeof width !== 'undefined' ? width : 290;
  height = typeof height !== 'undefined' ? height : 290;
  text_y = typeof text_y !== 'undefined' ? text_y : "-.10em";

  var dataset = {
        lower: calcPercent(0),
        upper: calcPercent(percent)
      },
      radius = Math.min(width, height) / 2,
      pie = d3.layout.pie().sort(null),
      format = d3.format(".0%");

  var arc = d3.svg.arc()
        .innerRadius(radius - 20)
        .outerRadius(radius);

  var svg = d3.select(element).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var path = svg.selectAll("path")
        .data(pie(dataset.lower))
        .enter().append("path")
        .attr("class", function(d, i) { return theClass + "color" + i })
        .attr("d", arc)
        .each(function(d) { this._current = d; }); // store the initial values

  var text = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", text_y)
        .attr('class', theClass + 'color0')

  if (typeof(percent) === "string") {
    text.text(percent);
  }
  else {
    var progress = 0;
    var timeout = setTimeout(function () {
      clearTimeout(timeout);
      path = path.data(pie(dataset.upper)); // update the data
      path.transition().duration(duration).delay(1000).attrTween("d", function (a) {
        // Store the displayed angles in _current.
        // Then, interpolate from _current to the new angles.
        // During the transition, _current is updated in-place by d3.interpolate.

        var i  = d3.interpolate(this._current, a);
        var i2 = d3.interpolate(progress, percent)
        this._current = i(0);
        return function(t) {
          text.text( format(i2(t) / 100) );
          return arc(i(t));
        };
      }); // redraw the arcs
    }, 200);
  }
};

function calcPercent(percent) {
  return [percent, 100-percent];
};

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
