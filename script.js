function isReady () {
  console.log("I'm ready!");
  return true;
}

function saveCeol (ceolString) {
  console.log("saveCeol", ceolString);
  location.hash = ceolString;
}

function loadCeol () {
  var ceolString = location.hash.slice(1);
  console.log("loadCeol", ceolString);
  return ceolString;
}
