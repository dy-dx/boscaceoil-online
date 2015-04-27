var $ = require('jquery');
var QueryString = require('query-string');
var Parse = require('parse').Parse;
var cfg = require('./cfg');

Parse.initialize(cfg.PARSE_APP_ID, cfg.PARSE_JAVASCRIPT_ID);
var Track = Parse.Object.extend("Track");

var currentUser = Parse.User.current();
var currentTrack = null;

// expose global "api" for flash ExternalInterface stuff
window.Bosca = {
  isReady: function () {
    return !!currentTrack;
  },
  saveCeol: function (ceolString) {
    console.log("saveCeol", ceolString);
    // location.hash = ceolString;
    currentTrack.set("ceol", ceolString);
    currentTrack.save();
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

function newTrack () {
  var track = new Track();
  track.set('title', 'untitled');
  if (currentUser) {
    track.set("parent", currentUser);
  }
  currentTrack = track;
  return track;
}




if (currentUser) {
    // do stuff with the user
} else {
    // show the signup or login page
}

var currentTrackId = QueryString.parse(location.search).track;
loadTrack(currentTrackId, function (err, track) {
  if (err) {
    console.log(err);
    currentTrack = newTrack();
  } else {
    currentTrack = track;
  }
});
