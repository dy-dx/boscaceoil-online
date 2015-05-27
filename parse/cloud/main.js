var _ = require('underscore'); // underscore is already available on cloud code
var Validator = require('cloud/modules/validator.js');

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("getTrack", function (request, response) {
  Parse.Cloud.useMasterKey();

  var Track = Parse.Object.extend("Track");
  var query = new Parse.Query(Track);
  var id = request.params.id;
  query.get(id, {
    success: function (track) {
      track.increment('views', 1);
      // Don't care about err handling here
      track.save(null, { useMasterKey: true });

      response.success(track);
    },
    error: function (obj, err) {
      return response.error(err);
    }
  });
});

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  var obj = request.object;
  var email = obj.get('email');
  var username = obj.get('username');

  // before create
  if ( obj.isNew() ) {

    // Validate username
    if ( !Validator.isAlphanumeric(username) || !Validator.isLowercase(username) ) {
      return response.error('invalid username');
    }
    // Validate email
    if ( !Validator.isEmail(email) ) {
      return response.error('invalid email');
    }

  // update
  } else {
    var dirtyKeys = obj.dirtyKeys();
    // Don't allow changes to username/ACL unless master
    if (!request.master) {
      for (var i=0, len=dirtyKeys.length; i<len; i++) {
        if ( dirtyKeys[i] === 'username' || dirtyKeys[i] === 'ACL' ) {
          return response.error("User is not allowed to modify " + dirtyKeys[i]);
        }
        if ( dirtyKeys[i] === 'email' && !Validator.isEmail(email) ) {
          return response.error('invalid email');
        }
      }
    }

  }

  response.success();
});


Parse.Cloud.afterSave(Parse.User, function(request) {
  var obj = request.object;

  // after create
  if ( !obj.existed() ) {
    // Set ACL on new user
    Parse.Cloud.useMasterKey();

    var userACL = new Parse.ACL(obj);
    userACL.setPublicReadAccess(false);
    userACL.setPublicWriteAccess(false);
    obj.setACL(userACL);
    obj.save();
  }
});


Parse.Cloud.beforeSave("Track", function(request, response) {
  var track = request.object;
  var title = track.get('title');

  // beforeCreate
  if ( track.isNew() ) {
    // Set views to 0
    track.set('views', 0);

    var trackACL = null;

    // Set user
    if (request.user) {
      console.log("we got a request.user");
      track.set('user', request.user);
      trackACL = new Parse.ACL(request.user);

    } else {
      console.log("no request.user here");
      track.set('user', null);
      trackACL = new Parse.ACL();
    }

    trackACL.setPublicReadAccess(true);
    trackACL.setPublicWriteAccess(false);
    track.setACL(trackACL);

  // update
  } else {
    // Don't allow changes to ownership or ACL unless master
    if (!request.master) {
      var dirtyKeys = track.dirtyKeys();
      for (var i=0, len=dirtyKeys.length; i<len; i++) {
        if ( dirtyKeys[i] === 'user' || dirtyKeys[i] === 'ACL' ) {
          return response.error("User is not allowed to modify track's " + dirtyKeys[i]);
        }
      }
    }
  }

  // normalize title
  title = Validator.trim(title);
  title = Validator.stripLow(title);
  if (!title.length) {
    title = 'untitled';
  }
  track.set('title', title);

  // Todo: validate ceol string

  response.success();
});

