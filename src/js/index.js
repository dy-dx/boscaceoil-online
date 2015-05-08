var $ = global.$ = global.jQuery = require('jquery');
// jQuery plugins, under "browser" key in package.json
require('bootstrap-modal');


var page = require('page');
var QueryString = require('query-string');
var Parse = require('parse').Parse;
window.Parse = Parse; // for debugging
var Editor = require('./editor');
var Profile = require('./profile');
var cfg = require('./cfg');


Parse.initialize(cfg.PARSE_APP_ID, cfg.PARSE_JAVASCRIPT_ID);
var Track = Parse.Object.extend("Track");

var editor = window.editor = new Editor();
// expose global "api" for flash ExternalInterface.call stuff
window.Bosca = editor;

// backwards compatibility
var oldTrackId = QueryString.parse(window.location.search).track;
if (oldTrackId) {
  window.location.hash = '#!/track/' + oldTrackId;
  window.location.search = '';
}

// Routes

// page.base('/#!');
page.base(window.location.pathname + '#!');
page('/', editTrack);
page('/track/:trackId', loadTrack, editTrack);
page('/profile', loadProfile, showProfile);
page.exit('/profile', exitProfile);
page('/logout', logout);
page('*', notfound);
// page({hashbang: true});
page({hashbang: false});


function loadTrack (ctx, next) {
  _getTrack(ctx.params.trackId, function (err, track) {
    if (err) {
      console.log(err);
      page('/');
    } else {
      ctx.track = track;
      next();
    }
  });
}

function editTrack (ctx, next) {
  if (ctx.track) {
    editor.loadTrack(ctx.track);
  } else {
    editor.setNewTrack();
  }
  updateTrackInfo();
}

function notfound () {
  page('/');
}

function logout (ctx) {
  Parse.User.logOut();
  // page.redirect here is better so /logout is not in history, but
  // it bugs out with the reload. Fix it later.
  page('/');
  // probably just wanna reload here but we'll see
  window.location.reload(true);
}

function loadProfile (ctx, next) {
  if (!Parse.User.current()) {
    page.redirect('/');
  }
  ctx.profile = new Profile(Parse.User.current());
  ctx.profile.fetchData(null, function (err, data) {
    if (err) { return alert(JSON.stringify(err)); }
    next();
  });
}

function showProfile (ctx, next) {
  var tracks = ctx.profile.tracks;
  var htmlstrings = [];
  for (var i=0, len=tracks.length; i<len; i++) {
    htmlstrings.push('<tr><td><a href="#!/track/');
    htmlstrings.push(tracks[i].id);
    htmlstrings.push('">');
    var escapedTitle = $('<div/>').text(tracks[i].get('title')).html();
    htmlstrings.push(escapedTitle);
    htmlstrings.push('</a></td><td>');
    htmlstrings.push(tracks[i].createdAt);
    htmlstrings.push('</td></tr>');
  }
  $('#profile-modal').find('tbody').html(htmlstrings.join(''));

  $('#profile-modal').modal('show');
}

function exitProfile (ctx, next) {
  $('#profile-modal').modal('hide');
  // TODO: go to previous state in history
  next();
}


// helpers

function _getTrack (id, cb) {
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

function _notImplemented () {
  window.alert('Not implemented');
  return false;
}

// Menu actions
require('./login-form').setup();
$('#save-button').click(function (e) {
  e.preventDefault();
  editor.saveTrack();
});
$('#delete-button').click(function (e) {
  e.preventDefault();
  if (window.confirm('Are you sure you want to delete this track?')) {
    editor.deleteTrack(function (err) {
      if (err) {
        console.log(err);
        alert('Error deleting track');
      } else {
        page.redirect('/');
      }
    });
  }
});
$('#export-wav-button').click(function (e) {
  e.preventDefault();
  editor.exportWav();
});
$('#export-ceol-button').click(function (e) {
  e.preventDefault();
  editor.exportCeol();
});
$('#import-ceol-button').click(function (e) {
  e.preventDefault();
  $('#import-ceol-input').click();
});
$('#import-ceol-input').change(function (e) {
  var file = this.files[0];
  if (!file) { return; }
  var reader = new window.FileReader();
  reader.onload = function (e) {
    editor.importCeol(e.target.result);
  };
  reader.readAsText(file);
});


function updateUserInfo () {
  var user = Parse.User.current();
  var userExists = !!user;
  if (userExists) {
    $('#profile-link').text(user.get('username'));
  }
  // show/hide user menu, login link etc
  $('.login-link-container').toggleClass('hidden', userExists);
  $('.user-action-menu').toggleClass('hidden', !userExists);
}

function updateTrackInfo () {
  var user = Parse.User.current();
  var track = editor.track;
  var trackUser = track.get('user');

  var canEditTrack = false;

  if (editor.trackLoaded) {
    // Check if track belongs to current user
    if (!!user && !!trackUser && user.id === trackUser.id) {
      canEditTrack = true;
    } else {
      canEditTrack = false;
    }
  } else {
    // New track. Can be saved.
    canEditTrack = true;
  }

  var canDeleteTrack = canEditTrack && !track.isNew();

  $('#track-title').val(track.get('title'));
  $('#track-title').prop('readonly', !canEditTrack);
  $('#save-button').toggleClass('hidden', !canEditTrack);
  $('#delete-button').toggleClass('hidden', !canDeleteTrack);
  $('#import-ceol-button').toggleClass('hidden', !canEditTrack);
}

updateUserInfo();
