var Parse = require('parse').Parse;
var Track = Parse.Object.extend("Track");

function Editor () {
  this.track = null;
  this.trackLoaded = false;
}

// Called by BoscaCeoil.swf to determine when to start
Editor.prototype.isReady = function () {
  this.swf = document.getElementById("BoscaCeoil");
  return !!this.track;
};

// Called by BoscaCeoil.swf to retrieve ceol upon startup.
// Must return either ceol or empty string.
Editor.prototype.loadCeol = function () {
  if (!this.trackLoaded) {
    return '';
  }
  var ceolString = this.track.get("ceol");
  console.log("loadCeol", ceolString);
  // todo: validate more
  return ceolString || '';
};


Editor.prototype.loadTrack = function (track) {
  this.track = track;
  this.trackLoaded = true;
};

Editor.prototype.setNewTrack = function () {
  this.track = new Track();
  this.track.set('title', 'untitled');
};

Editor.prototype.saveTrack = function () {
  var ceolString = this.swf.getCeolString();
  console.log("saveCeol", ceolString);
  // Todo: check permissions
  this.track.set("ceol", ceolString);
  this.track.save().then(function(track) {
    // the object was saved successfully
    // append querystring
    var parsed = QueryString.parse(window.location.search);
    parsed.track = track.id;
    window.location.search = QueryString.stringify(parsed);
  }, function (error) {
    // the save failed
    window.alert("save failed");
  });
};


module.exports = Editor;
