// Not a real module! Just for moving some ugly JS out of main.

var Parse = require('parse').Parse;

var LoginForm = {};

LoginForm.setup = function () {
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

};

module.exports = LoginForm;
