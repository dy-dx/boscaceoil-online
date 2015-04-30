var $ = global.$ = global.jQuery = require('jquery');
// jQuery plugins, under "browser" key in package.json
require('bootstrap-modal');


var page = require('page');
var QueryString = require('query-string');
var Parse = require('parse').Parse;
window.Parse = Parse; // for debugging
var Editor = require('./editor');
var cfg = require('./cfg');


Parse.initialize(cfg.PARSE_APP_ID, cfg.PARSE_JAVASCRIPT_ID);
var Track = Parse.Object.extend("Track");

var editor = new Editor();
// expose global "api" for flash ExternalInterface.call stuff
window.Bosca = editor;


function getTrack (id, cb) {
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
  var parsed = QueryString.parse(window.location.search);
  delete parsed.track;
  window.location.search = QueryString.stringify(parsed);
}

function logout () {
  Parse.User.logOut();
  window.location.reload(true);
}


// Menu actions
require('./login-form').setup();
$('#new-button').click(function (e) {
  e.preventDefault();
  newTrack();
});
$('#save-button').click(function (e) {
  e.preventDefault();
  editor.saveTrack();
});
$('#logout-link').click(function (e) {
  e.preventDefault();
  logout();
});
$('#profile-link').click(function (e) {
  e.preventDefault();
  // todo
});

if (Parse.User.current()) {
  // reveal user menu, logout link etc
  $('.user-action-menu').removeClass('hidden');
  $('#profile-link').text(Parse.User.current().get('username'));
} else {
  // reveal the login/signup link
  $('.login-link-container').removeClass('hidden');
}

// determine whether to load a track (?track=id) or

var parsedQs = QueryString.parse(location.search);
if (parsedQs.hasOwnProperty('track')) {
  var currentTrackId = parsedQs.track;
  getTrack(currentTrackId, function (err, track) {
    if (err) {
      console.log(err);
      newTrack();
    } else {
      editor.loadTrack(track);
    }
  });
} else {
  editor.setNewTrack();
}
