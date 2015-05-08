var page = require('page');
var saveAs = require('filesaver.js');
var Parse = require('parse').Parse;
var Track = Parse.Object.extend("Track");

function Editor () {
  this.track = null;
  this.trackLoaded = false;
}

// Called by BoscaCeoil.swf to determine when to start
Editor.prototype._isReady = function () {
  this.swf = document.getElementById("BoscaCeoil");
  return !!this.track;
};

// Called by BoscaCeoil.swf to retrieve ceol upon startup.
// Must return either ceol or empty string.
Editor.prototype._getStartupCeol = function () {
  if (!this.trackLoaded) {
    return '';
  }
  var ceolString = this.track.get("ceol");
  console.log("loadCeol", ceolString);
  // todo: validate more
  return ceolString || '';
};

// Calls control.getCeolString in BoscaCeoil.swf
Editor.prototype._getCeolString = function () {
  return this.swf.getCeolString();
};

// Calls control.invokeCeolWeb in BoscaCeoil.swf
Editor.prototype._invokeCeol = function (ceolStr) {
  this.swf.invokeCeolWeb(ceolStr);
};

// Calls control.newsong in BoscaCeoil.swf
Editor.prototype._newSong = function () {
  this.swf.newSong();
};


Editor.prototype.loadTrack = function (track) {
  if (this.track) {
    this._invokeCeol(track.get('ceol'));
  } else {
    // Don't invoke ceol if first load, to avoid bpm startup bug.
    // The swf will call _getStartupCeol on its own.
  }
  this.track = track;
  this.trackLoaded = true;
};

Editor.prototype.setNewTrack = function () {
  if (this.track) {
    this._newSong();
  } else {
    // Don't invoke newsong if first load.
    // The swf will call _getStartupCeol on its own.
  }
  this.trackLoaded = false;
  this.track = new Track();
  this.track.set('title', '');
};

Editor.prototype.saveTrack = function () {
  var newTitle = $('#track-title').val();
  if (newTitle !== this.track.get('title')) {
    this.track.set('title', newTitle);
  }

  var ceolString = this._getCeolString();
  console.log("saveCeol", ceolString);
  // Todo: check permissions
  this.track.set("ceol", ceolString);
  this.track.save().then(function(track) {
    // update route
    page.redirect('/track/' + track.id);
  }, function (error) {
    // the save failed
    window.alert("save failed");
  });
};

Editor.prototype.deleteTrack = function (cb) {
  var self = this;
  this.track.destroy({
    success: function (obj) {
      cb(null);
      self.track = null;
    },
    error: function (obj, err) {
      cb(err);
    }
  });
};

Editor.prototype.exportCeol = function () {
  var title = $('#track-title').val() || 'untitled';
  var ceolString = this._getCeolString();
  var filename = title.replace(/[^a-z0-9]/gi, '_') + '.ceol';
  var blob = new Blob([ceolString], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, filename);
};

module.exports = Editor;
