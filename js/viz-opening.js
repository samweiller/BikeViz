var bucket1Male = [23106, 23639, 23731, 24122, 23538, 22060, 21999, 22650, 23960, 22085];
var bucket1Female = [22178, 22177, 22181, 22298, 22518, 22498, 22187, 22160, 21047, 21987];

var bucket2Male = [22099, 22089, 22242, 22122, 14943, 22078, 22332, 22010, 21975, 22106];
var bucket2Female = [19788, 20649, 22092, 22143, 22316, 18779, 16346, 21617, 18667, 16028];

var bucket3Male = [24726, 24765, 23591, 23602, 14636, 23576, 23316, 22129, 22103, 23741];
var bucket3Female = [22178, 23528, 23548, 22321, 22438, 22032, 14570, 23416, 24329, 23784];

var bucket4Male = [22085, 21992, 22098, 22665, 23165, 23366, 23557, 23120, 22272, 22320];
var bucket4Female = [21915, 22169, 23251, 23467, 23483, 22014, 23025, 22047, 22801, 22650];

var bucket5Male = [23949, 24173, 22491, 22540, 22444, 22219, 23120, 24004, 24266, 23865];
var bucket5Female = [22780, 23843, 23959, 24122, 24337, 23015, 23417, 23149, 22197, 23351];

var bucket6Male = [23641, 22732, 17882, 23956, 24765, 25309, 18331, 16469, 18808, 18328];
var bucket6Female = [20362, 22133, 14878,18280, 23531, 15707, 19850, 20863, 23926, 25160];

var bucket1MaleIdx = 0;
var bucket2MaleIdx = 0;
var bucket3MaleIdx = 0;
var bucket4MaleIdx = 0;
var bucket5MaleIdx = 0;
var bucket6MaleIdx = 0;

var bucket1FemaleIdx = 0;
var bucket2FemaleIdx = 0;
var bucket3FemaleIdx = 0;
var bucket4FemaleIdx = 0;
var bucket5FemaleIdx= 0;
var bucket6FemaleIdx = 0;

var currentAgeBucketSelection;
var currentGenderSelection;

//Gets called when the page is loaded.
function init() {

  setTimeout(fadeOutGIF, 5000);
  setTimeout(fadeInPersonaQuestion, 5400);

  $(".dropdown-menu li a").click(function(){
    var elementID = $(this).parents('.dropdown').attr('id');

    if (elementID == "openingview-dropdownAge") { //age dropdown
      createCookie("ageBucket", $(this).text(), 1);
      currentAgeBucketSelection = $(this).text();

    } else { //gender dropdown
      createCookie("genderBucket", $(this).text(), 1);
      currentGenderSelection = $(this).text();
    }

    //set dropdown text to the selection
    var selText = $(this).text();
    $(this).parents('.dropdown').find('.dropdown-toggle').html(selText+'<span class="caret"></span>');

    //testing cookies
    //console.log("age cookie" + readCookie("ageBucket"));
    //console.log("gender cookie" + readCookie("genderBucket"));

  });

  $("#openingview-nextArrow").click(function(){

    var bikeSelection;

    //find out dropdown selects, get value from array, store to cookie, index the value
    if (currentGenderSelection == "Female ") {
      console.log("Currently female selection");

      if (currentAgeBucketSelection == "16-25 ") {
         bikeSelection = bucket1Female[randomIntFromInterval(0,9)];
         bucket1FemaleIdx = bucket1FemaleIdx + 1;
      }

      if (currentAgeBucketSelection == "26-35 ") {
        bikeSelection = bucket2Female[randomIntFromInterval(0,9)];
        bucket2FemaleIdx = bucket2FemaleIdx + 1;
      }

      if (currentAgeBucketSelection == "36-45 ") {
        bikeSelection = bucket3Female[randomIntFromInterval(0,9)];
        bucket3FemaleIdx = bucket3FemaleIdx + 1;
      }

      if (currentAgeBucketSelection == "46-55 ") {
        bikeSelection = bucket4Female[randomIntFromInterval(0,9)];
        bucket4FemaleIdx = bucket4FemaleIdx + 1;
      }

      if (currentAgeBucketSelection == "56-65 ") {
        bikeSelection = bucket5Female[randomIntFromInterval(0,9)];
        bucket5FemaleIdx = bucket5FemaleIdx + 1;
      }

      if (currentAgeBucketSelection == "66-75 ") {
        bikeSelection = bucket6Female[randomIntFromInterval(0,9)];
        bucket6FemaleIdx = bucket6FemaleIdx + 1;
      }

      createCookie("selectedBike", bikeSelection, 1);
      console.log("stored bike cookie " + bikeSelection);

    } else {
      console.log("Currently male selection");

      if (currentAgeBucketSelection == "16-25 ") {
         bikeSelection = bucket1Male[randomIntFromInterval(0,9)];
         bucket1MaleIdx = bucket1MaleIdx + 1;
      }

      if (currentAgeBucketSelection == "26-35 ") {
        bikeSelection = bucket2Male[randomIntFromInterval(0,9)];
        bucket2MaleIdx = bucket2MaleIdx + 1;
      }

      if (currentAgeBucketSelection == "36-45 ") {
        bikeSelection = bucket3Male[randomIntFromInterval(0,9)];
        bucket3MaleIdx = bucket3MaleIdx + 1;
      }

      if (currentAgeBucketSelection == "46-55 ") {
        bikeSelection = bucket4Male[randomIntFromInterval(0,9)];
        bucket4MaleIdx = bucket4MaleIdx + 1;
      }

      if (currentAgeBucketSelection == "56-65 ") {
        bikeSelection = bucket5Male[randomIntFromInterval(0,9)];
        bucket5MaleIdx = bucket5MaleIdx + 1;
      }

      if (currentAgeBucketSelection == "66-75 ") {
        bikeSelection = bucket6Male[bucket6MaleIdx];
        bucket6MaleIdx = bucket6MaleIdx + 1;
      }

      createCookie("selectedBike", bikeSelection, 1);
      console.log("stored bike cookie " + bikeSelection);

    }


    var nextArrow = document.getElementById("openingview-allPersona");
    fadeOut(nextArrow);
    setTimeout(navigateToBikeView, 1400);

  });

}

function navigateToBikeView() {
  window.location.href = "./bikeView.html";
}

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
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

function fadeOutGIF() {

  var element1 = document.getElementById("openingview-storyText");
  fadeOut(element1);

  var element2 = document.getElementById("openingview-bikeGIF");
  fadeOut(element2);

}

function fadeInPersonaQuestion() {

  var element3 = document.getElementById("openingview-allPersona");
  fadeIn(element3);

}





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
