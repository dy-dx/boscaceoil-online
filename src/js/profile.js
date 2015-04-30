var Parse = require('parse').Parse;
var Track = Parse.Object.extend("Track");

function Profile (user) {
  this.user = user;
  this.trackQuery = this.makeQuery(user);
  this.tracks = [];
}

Profile.prototype.makeQuery = function (user) {
  if (!user) { return false; }

  var query = new Parse.Query(Track)
      .equalTo('user', user)
      .descending('createdAt')
      .select('title');

  return query;
};


Profile.prototype.fetchData = function (page, cb) {
  var self = this;
  this.trackQuery.find({
    success: function (results) {
      self.tracks = results;
      cb(null, results);
    },
    error: function (obj, err) {
      cb(err);
    }
  });
};



module.exports = Profile;
