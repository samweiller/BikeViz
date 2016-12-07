//Gets called when the page is loaded.
function init() {

  setTimeout(fadeOutGIF, 5000);
  setTimeout(fadeInPersonaQuestion, 5400);

  $(".dropdown-menu li a").click(function(){
    var elementID = $(this).parents('.dropdown').attr('id');

    if (elementID == "openingview-dropdownAge") { //age dropdown
      createCookie("ageBucket", $(this).text(), 1);
    } else { //gender dropdown
      createCookie("genderBucket", $(this).text(), 1);
    }

    //set dropdown text to the selection
    var selText = $(this).text();
    $(this).parents('.dropdown').find('.dropdown-toggle').html(selText+'<span class="caret"></span>');

    //testing cookies
    //console.log("age cookie" + readCookie("ageBucket"));
    //console.log("gender cookie" + readCookie("genderBucket"));

  });

  $("#openingview-nextArrow").click(function(){

    var nextArrow = document.getElementById("openingview-allPersona");
    fadeOut(nextArrow);
    setTimeout(navigateToBikeView, 1400);

  });

}

function navigateToBikeView() {
  window.location.href = "./bikeView.html";
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
