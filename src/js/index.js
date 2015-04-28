var $ = require('jquery');
var QueryString = require('query-string');
var Parse = require('parse').Parse;
window.Parse = Parse; // for debugging
var cfg = require('./cfg');

Parse.initialize(cfg.PARSE_APP_ID, cfg.PARSE_JAVASCRIPT_ID);
var Track = Parse.Object.extend("Track");

var currentUser = Parse.User.current();
var currentTrack = null;

// expose global "api" for flash ExternalInterface.call stuff
window.Bosca = {
  isReady: function () {
    return !!currentTrack;
  },
  loadCeol: function () {
    var ceolString = currentTrack.get("ceol");
    console.log("loadCeol", ceolString);
    // todo: validate more
    return ceolString || "";
  }
};


function loadTrack (id, cb) {
  var query = new Parse.Query(Track);
  query.get(id, {
    success: function (track) {
      cb(null, track);
    },
    error: function (obj, err) {
      cb(err);
    }
  });
}

function makeNewTrack () {
  var track = new Track();
  track.set('title', 'untitled');
  return track;
}

function saveTrack () {
  var ceolString = document.getElementById("BoscaCeoil").getCeolString();
  console.log("saveCeol", ceolString);
  // Todo: check permissions
  currentTrack.set("ceol", ceolString);
  currentTrack.save().then(function(track) {
    // the object was saved successfully
    // append querystring
    var parsed = QueryString.parse(window.location.search);
    parsed.track = track.id;
    window.location.search = QueryString.stringify(parsed);
  }, function (error) {
    // the save failed
    window.alert("save failed");
  });
}

function newTrack () {
  var parsed = QueryString.parse(window.location.search);
  delete parsed.track;
  window.location.search = QueryString.stringify(parsed);
}

$('#new-button').click(function (e) {
  newTrack();
  e.preventDefault();
});

$('#save-button').click(function (e) {
  saveTrack();
  e.preventDefault();
});

if (currentUser) {
    // do stuff with the user
} else {
    // show the signup or login page
}

var parsedQs = QueryString.parse(location.search);
if (parsedQs.hasOwnProperty('track')) {
  var currentTrackId = parsedQs.track;
  loadTrack(currentTrackId, function (err, track) {
    if (err) {
      console.log(err);
      newTrack();
    } else {
      currentTrack = track;
    }
  });
} else {
  currentTrack = makeNewTrack();
}
