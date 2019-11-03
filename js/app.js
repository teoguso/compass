/*const treeData = [
  [53, 14],
  [55, 16],
  [56, 17],
  [58, 19],]*/

/*
url: 'https://trees.codefor.de/api/trees/closest/',
                    data: {
                        point: e.latlng.lng + ',' + e.latlng.lat
                    },
*/

/*{var route = [ [13.37684703311472,52.48707409201542],
[13.380610915448056,52.487211114023175],
[13.380902435061513,52.487475359235916],
[13.380345598900224,52.487158107684756],
[13.37978875920448,52.48712176355076],
[13.39607125067393,52.49660967276511],
[13.396807519808668,52.496590355998094],
[13.395973890594082,52.4966161651151]]}*/

(async function () {
  "use strict";

  //set to true for debugging output
  var debug = false;
  
  //set true for presentation mode
  var demo = true;

  // our current position
  var positionCurrent = {
    lat: null,
    lng: null,
    hng: null,
  };

  const store = {
    treeId: null,
    species: null,
    latCT: null,
    lonCT: null,
    heading: 0,
    northOffset: 0,
    currentLat: null,
    currentLon: null,
  }

  // the outer part of the compass that rotates
  var rose = document.getElementById("rose");
  
  var needle = document.getElementById("needle");


  // elements that ouput our position
  var positionLat = document.getElementById("position-lat");
  var positionLng = document.getElementById("position-lng");
  var positionHng = document.getElementById("position-hng");


  // debug outputs
  var debugOrientation = document.getElementById("debug-orientation");
  var debugOrientationDefault = document.getElementById("debug-orientation-default");


  // info popup elements, pus buttons that open popups
  var popup = document.getElementById("popup");
  var popupContents = document.getElementById("popup-contents");
  var popupInners = document.querySelectorAll(".popup__inner");
  var btnsPopup = document.querySelectorAll(".btn-popup");


  // buttons at the bottom of the screen
  var btnLockOrientation = document.getElementById("btn-lock-orientation");
  var btnNightmode = document.getElementById("btn-nightmode");
  var btnMap = document.getElementById("btn-map");
  var btnInfo = document.getElementById("btn-info");


  // if we have shown the heading unavailable warning yet
  var warningHeadingShown = false;


  // switches keeping track of our current app state
  var isOrientationLockable = false;
  var isOrientationLocked = false;
  var isNightMode = false;;

  // the orientation of the device on app load
  var defaultOrientation;


  // browser agnostic orientation
  function getBrowserOrientation() {
    var orientation;
    if (screen.orientation && screen.orientation.type) {
      orientation = screen.orientation.type;
    } else {
      orientation = screen.orientation ||
                    screen.mozOrientation ||
                    screen.msOrientation;
    }

    /*
      'portait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
                                device is in 'normal' orientation
                              for (screen width > screen height, e.g. large tablet, laptop)
                                device has been turned 90deg clockwise from normal

      'portait-secondary':    for (screen width < screen height)
                                device has been turned 180deg from normal
                              for (screen width > screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

      'landscape-primary':    for (screen width < screen height)
                                device has been turned 90deg clockwise from normal
                              for (screen width > screen height)
                                device is in 'normal' orientation

      'landscape-secondary':  for (screen width < screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
                              for (screen width > screen height)
                                device has been turned 180deg from normal
    */

    return orientation;
  }


  // browser agnostic orientation unlock
  function browserUnlockOrientation() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      screen.msUnlockOrientation();
    }
  }


  // browser agnostic document.fullscreenElement
  function getBrowserFullscreenElement() {
    if (typeof document.fullscreenElement !== "undefined") {
      return document.fullscreenElement;
    } else if (typeof document.webkitFullscreenElement !== "undefined") {
      return document.webkitFullscreenElement;
    } else if (typeof document.mozFullScreenElement !== "undefined") {
      return document.mozFullScreenElement;
    } else if (typeof document.msFullscreenElement !== "undefined") {
      return document.msFullscreenElement;
    }
  }


  // browser agnostic document.documentElement.requestFullscreen
  function browserRequestFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }


  // browser agnostic document.documentElement.exitFullscreen
  function browserExitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
  
  async function findClosestTree(lat, lon) {
    // alert("trying for "+'https://trees.codefor.de/api/trees/closest/?point=' + positionCurrent.lng + "," + positionCurrent.lat);  
    const response = await fetch('https://trees.codefor.de/api/trees/closest/?point=' + lon + "," + lat)
    // .then(function(response) {
    if (!response.ok) {
      throw new Error('konnte nicht geladen werden');
    }
//     .then(function(json) {
//        // Hier Code zum einarbeiten der Kurse in die Anzeige
      
//         alert( JSON.stringify(json["geometry"]["coordinates"]));
//     })
//     .catch(function(err) {
//        // Hier Fehlerbehandlung
//         alert(err);
//     })
    // alert(await response.json())
    const jdata = await response.json()
    // alert(jdata)
    // const treeId = jdata.id
    const [lonCT, latCT] = jdata.geometry.coordinates  // ["geometry"]["coordinates"]
    const treeId = jdata.properties.location_number
    const treeType = jdata.properties.species_german
    // alert(lonCT)
    return [treeId, lonCT, latCT, treeType]
  }

  // called on device orientation change
  function onHeadingChange(event) {
    var heading = event.alpha;
    
    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.alpha + event.webkitCompassHeading; //iOS non-standard
    }
    // else {
    //   alert("compassHeading undefined")
    // }
    store.heading = heading
    heading = heading + store.northOffset
    
    var orientation = getBrowserOrientation();

    if (typeof heading !== "undefined" && heading !== null) { // && typeof orientation !== "undefined") {
      // we have a browser that reports device heading and orientation


      if (debug) {
        debugOrientation.textContent = orientation;
      }


      // what adjustment we have to add to rotation to allow for current device orientation
      var adjustment = 0;
      if (defaultOrientation === "landscape") {
        adjustment -= 90;
      }

      if (typeof orientation !== "undefined") {
        var currentOrientation = orientation.split("-");

        if (defaultOrientation !== currentOrientation[0]) {
          if (defaultOrientation === "landscape") {
            adjustment -= 270;
          } else {
            adjustment -= 90;
          }
        }

        if (currentOrientation[1] === "secondary") {
          adjustment -= 180;
        }
      }
      // compensate for some weird offset
      //adjustment = adjustment + 90;

      // MOCK TREE POSITION
      // var closestTree = [52.493806, 13.448278];
      var closestTree = [2.518288, 13.542091];
   
      function distance(lat1, lon1, lat2, lon2, unit) {
          if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
          }
          else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
              dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit=="K") { dist = dist * 1.609344 }
            if (unit=="N") { dist = dist * 0.8684 }
            return dist;
          }
        }
        
      function distAtoB(lat_A, lon_A, lat_B, lon_B) {
        var delta_lat = lat_B - lat_A;
        var delta_lon = lon_B - lon_A;
        return Math.sqrt(delta_lon*delta_lon + delta_lat*delta_lat)
      }
      
      function angleAtoB(lat_A, lon_A, lat_B, lon_B) {
        
          var delta_lat = lat_B - lat_A;
          var delta_lon = lon_B - lon_A;

          // var projection = delta_lon / delta_lat
          let angularCoeff = delta_lat / Math.sqrt( delta_lat * delta_lat + delta_lon * delta_lon )
          var angle = - Math.acos( angularCoeff ) * 180 / Math.PI;
        
          return angle;
         
      }

      
      positionCurrent.hng = heading + adjustment;
      
      if ((store.latCT === null) || (store.lonCT === null)) {
        store.latCT = positionCurrent.lat
        store.lonCT = positionCurrent.lng
      }
      
      
     /* if(demo) {
            let treeAngle = angleAtoB(store.currentLat, positionCurrent.lng, store.latCT, store.lonCT);
            let treeDist = distance(positionCurrent.lat, positionCurrent.lng, store.latCT, store.lonCT, "K");
      }
      else {*/
            let treeAngle = angleAtoB(positionCurrent.lat, positionCurrent.lng, store.latCT, store.lonCT);
            let treeDist = distance(positionCurrent.lat, positionCurrent.lng, store.latCT, store.lonCT, "K");
      //}
      
      var nextTreeHeading = positionCurrent.hng + treeAngle;
      nextTreeHeading = nextTreeHeading < 0 ? 360 + nextTreeHeading : nextTreeHeading;
      
      var phase = positionCurrent.hng < 0 ? 360 + positionCurrent.hng : positionCurrent.hng;
      // text output for "HDG"
      positionHng.textContent = store.species + ", " + Math.round(treeDist*1000 * 100)/100 +" m"+ ", " + store.currentLat + ", " + store.currentLon;
      //store.treeId + ", " + store.latCT  + ", " +Math.round(treeAngle*100000)/100000 +"°" + ", " + Math.round(treeDist*1000 * 100)/100 +" m"; //(360 - phase | 0) + "°";

      // apply rotation to compass rose
      if (typeof rose.style.transform !== "undefined") {
       rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";  
      } else if (typeof rose.style.webkitTransform !== "undefined") {
        rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
      }
      // apply rotation to compass needle
      if (typeof needle.style.transform !== "undefined") {
       // rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";
         needle.style.transform = "rotateZ(" + nextTreeHeading + "deg)";
      } else if (typeof needle.style.webkitTransform !== "undefined") {
        //rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
        needle.style.webkitTransform = "rotateZ(" + nextTreeHeading + "deg)";
      }
    } else {
      // device can't show heading

      positionHng.textContent = "n/a";
      showHeadingWarning();
    }
  }

  function showHeadingWarning() {
    if (!warningHeadingShown) {
      popupOpen("noorientation");
      warningHeadingShown = true;
    }
  }
  
  function onFullscreenChange() {
    if (isOrientationLockable && getBrowserFullscreenElement()) {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(getBrowserOrientation()).then(function () {
        }).catch(function () {
        });
      }
    } else {
      lockOrientationRequest(false);
    }
  }

  function toggleOrientationLockable(lockable) {
    isOrientationLockable = lockable;

    if (isOrientationLockable) {
      btnLockOrientation.classList.remove("btn--hide");

      btnNightmode.classList.add("column-25");
      btnNightmode.classList.remove("column-33");
      btnMap.classList.add("column-25");
      btnMap.classList.remove("column-33");
      btnInfo.classList.add("column-25");
      btnInfo.classList.remove("column-33");
    } else {
      btnLockOrientation.classList.add("btn--hide");

      btnNightmode.classList.add("column-33");
      btnNightmode.classList.remove("column-25");
      btnMap.classList.add("column-33");
      btnMap.classList.remove("column-25");
      btnInfo.classList.add("column-33");
      btnInfo.classList.remove("column-25");
    }
  }

  function checkLockable() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock(getBrowserOrientation()).then(function () {
        toggleOrientationLockable(true);
        browserUnlockOrientation();
      }).catch(function (event) {
        if (event.code === 18) { // The page needs to be fullscreen in order to call lockOrientation(), but is lockable
          toggleOrientationLockable(true);
          browserUnlockOrientation(); //needed as chrome was locking orientation (even if not in fullscreen, bug??)
        } else {  // lockOrientation() is not available on this device (or other error)
          toggleOrientationLockable(false);
        }
      });
    } else {
      toggleOrientationLockable(false);
    }
  }

  function lockOrientationRequest(doLock) {
    if (isOrientationLockable) {
      if (doLock) {
        browserRequestFullscreen();
        lockOrientation(true);
      } else {
        browserUnlockOrientation();
        browserExitFullscreen();
        lockOrientation(false);
      }
    }
  }

  function lockOrientation(locked) {
    if (locked) {
      btnLockOrientation.classList.add("active");
    } else {
      btnLockOrientation.classList.remove("active");
    }

    isOrientationLocked = locked;
  }

  function toggleOrientationLock() {
    if (isOrientationLockable) {
      lockOrientationRequest(!isOrientationLocked);
    }
  }

  function locationUpdate(position) {
    positionCurrent.lat = position.coords.latitude;
    positionCurrent.lng = position.coords.longitude;

    positionLat.textContent = decimalToSexagesimal(positionCurrent.lat, "lat");
    positionLng.textContent = decimalToSexagesimal(positionCurrent.lng, "lng");
  }

  function locationUpdateFail(error) {
    positionLat.textContent = "n/a";
    positionLng.textContent = "n/a";
    console.log("location fail: ", error);
  }

  function setNightmode(on) {

    if (on) {
      btnNightmode.classList.add("active");
    } else {
      btnNightmode.classList.remove("active");
    }

    window.setTimeout(function() {
      if (on) {
        document.documentElement.classList.add("nightmode");
      } else {
        document.documentElement.classList.remove("nightmode");
      }
    }, 1);


    isNightMode = on;
  }

  // find nearest tree in a route
  async function startRoute() {
    if(demo) {
      // set current position to useres GPS coordinates at beginning
      if ((store.currentLat === null) || (store.currentLon === null)) {
        const newTree = await findClosestTree(positionCurrent.lat, positionCurrent.lng);
        store.treeId = newTree[0]
        store.lonCT = newTree[1]
        store.latCT = newTree[2]
        store.species = newTree[3]
        
        store.currentLat = store.latCT;
        store.currentLon = store.lonCT;
      }
      else {
        // now move position by 18.5 meters Northvand ~18.5m West from prvious tree
        //  every time this function is called
        var move = 1 / 60 / 100; // 1 angle minute equals 1852 m

        store.currentLat = store.currentLat + move * Math.cos(store.heading);
        store.currentLon = store.currentLon - move * Math.sin(store.heading);  // going westwards means subtracting on eastern hemisphere
      
        //Now find new tree from these coordinates
        const newTree = await findClosestTree(store.currentLat, store.currentLon);
        store.treeId = newTree[0]
        store.lonCT = newTree[1]
        store.latCT = newTree[2]
        store.species = newTree[3]
      }
    }
    else {
      const newTree = await findClosestTree(positionCurrent.lat, positionCurrent.lng);
      store.treeId = newTree[0]
      store.lonCT = newTree[1]
      store.latCT = newTree[2]
      store.species = newTree[3]
    }
    //setNightmode(!isNightMode);
  }

  function openMap() {
    // window.open("https://www.google.com/maps/place/@" + positionCurrent.lat + "," + positionCurrent.lng + ",16z", "_blank")
    store.northOffset = - store.heading
  }

  function popupOpenFromClick(event) {
    popupOpen(event.currentTarget.dataset.name);
  }

  function popupOpen(name) {
    var i;
    for (i=0; i<popupInners.length; i++) {
      popupInners[i].classList.add("popup__inner--hide");
    }
    document.getElementById("popup-inner-" + name).classList.remove("popup__inner--hide");

    popup.classList.add("popup--show");
  }

  function popupClose() {
    popup.classList.remove("popup--show");
  }

  function popupContentsClick(event) {
    event.stopPropagation();
  }

  function decimalToSexagesimal(decimal, type) {
    var degrees = decimal | 0;
    var fraction = Math.abs(decimal - degrees);
    var minutes = (fraction * 60) | 0;
    var seconds = (fraction * 3600 - minutes * 60) | 0;

    var direction = "";
    var positive = degrees > 0;
    degrees = Math.abs(degrees);
    switch (type) {
      case "lat":
        direction = positive ? "N" : "S";
        break;
      case "lng":
        direction = positive ? "E" : "W";
        break;
    }

    return degrees + "° " + minutes + "' " + seconds + "\" " + direction;
  }

  if (screen.width > screen.height) {
    defaultOrientation = "landscape";
  } else {
    defaultOrientation = "portrait";
  }
  if (debug) {
    debugOrientationDefault.textContent = defaultOrientation;
  }
  
  function navEvent() {
    var view = document.getElementById('navEvent').style.visibility;
    if(view == "visible") {      
      document.getElementById('navEvent').style.visibility = "hidden";
      document.getElementById('squirrelSound').pause();
      document.getElementById('squirrelSound').currentTime = 0;
    }
    else {
      document.getElementById('navEvent').style.visibility = "visible";
      document.getElementById('squirrelSound').play();
    }
  }

  window.addEventListener("deviceorientation", onHeadingChange);

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  document.addEventListener("mozfullscreenchange", onFullscreenChange);
  document.addEventListener("MSFullscreenChange", onFullscreenChange);

  btnLockOrientation.addEventListener("click", toggleOrientationLock);
  btnNightmode.addEventListener("click", startRoute);
  btnMap.addEventListener("click", openMap);

  btnInfo.addEventListener("click", navEvent);
  
  /*
  var i;
  for (i=0; i<btnsPopup.length; i++) {
    btnsPopup[i].addEventListener("click", popupOpenFromClick);
  }

  popup.addEventListener("click", popupClose);
  popupContents.addEventListener("click", popupContentsClick);
*/
  
  navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
    enableHighAccuracy: false,
    maximumAge: 30000,
    timeout: 27000
  });

  setNightmode(false);
  checkLockable();

}());
