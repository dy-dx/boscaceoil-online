var $ = global.$ = global.jQuery = require('jquery');
// jQuery plugins, under "browser" key in package.json
require('bootstrap-modal');


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
  window.location.reload(true);
}

function logout () {
  Parse.User.logOut();
  currentUser = null;
  window.location.reload(true);
}


// Menu actions

$('#new-button').click(function (e) {
  e.preventDefault();
  newTrack();
});
$('#save-button').click(function (e) {
  e.preventDefault();
  saveTrack();
});
$('#logout-link').click(function (e) {
  e.preventDefault();
  logout();
});
$('#profile-link').click(function (e) {
  e.preventDefault();
  // todo
});


if (currentUser) {
  // do stuff with the user
  $('.user-action-menu').removeClass('hidden');
  $('#profile-link').text(currentUser.get('username'));
} else {
  // reveal the login/signup link
  $('.login-link-container').removeClass('hidden');
  // Set up login form
  $('#login-form').submit(function (e) {
    e.preventDefault();
    var username = $('#login-username').val().toLowerCase();
    var password = $('#login-password').val();
    Parse.User.logIn(username, password, {
      success: function (user) {
        window.location.reload(true);
      },
      error: function (user, error) {
        console.log(error);
        alert("Error: " + error.message);
      }
    });
  });
  // Set up signup form
  $('#signup-form').submit(function (e) {
    e.preventDefault();
    var user = new Parse.User();
    user.set('username', $('#signup-username').val().toLowerCase());
    user.set('password', $('#signup-password').val());
    user.set('email', $('#signup-email').val());
    user.signUp(null, {
      success: function (user) {
        window.location.reload(true);
      },
      error: function (user, error) {
        alert("Error: " + error.code + " " + error.message);
      }
    });
  });
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
