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

// Called by BoscaCeoil.swf to send us recorded .wav, b64 encoded
Editor.prototype._wavRecorded = function (wavB64) {
  this._saveWav(wavB64);
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

// Calls control.exportwav in BoscaCeoil.swf
Editor.prototype._exportWav = function () {
  this.swf.exportWav();
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

Editor.prototype.importCeol = function (ceolString) {
  this._invokeCeol(ceolString);
};

Editor.prototype.exportCeol = function () {
  var ceolString = this._getCeolString();
  var filename = this._makeFilename('ceol');
  var blob = new Blob([ceolString], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, filename);
};

Editor.prototype.exportWav = function () {
  this._exportWav();
};

Editor.prototype._saveWav = function (wavB64) {
  var filename = this._makeFilename('wav');
  var blob = this._base64toBlob(wavB64, 'application/octet-binary');
  saveAs(blob, filename);
};

Editor.prototype._base64toBlob = function (base64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = window.atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize;
    var end = Math.min(begin + sliceSize, bytesLength);

    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
};

Editor.prototype._makeFilename = function (extension) {
  var title = $('#track-title').val() || 'untitled';
  return title.replace(/[^a-z0-9]/gi, '_') + '.' + extension;
};

module.exports = Editor;
