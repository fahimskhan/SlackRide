const express = require('express');
const bodyParser = require('body-parser')
const app = express();
var Uber = require('node-uber');
var path = require('path');
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var uber = new Uber({
  client_id: "O8C33qIolVTjUvIUc2VSKr53cGwEYJfg",
  client_secret: CLIENT_SECRET,
  server_token: "QkVbdUtpeEX3FII34_J3BIcwEYO1KoX5bxW6Mws9",
  redirect_uri: 'http://localhost:3000/api/callback',
  name: 'SlackRide',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true, // optional, defaults to false
  // proxy: 'http://8570e687.ngrok.io' // optional, defaults to none
})

var ACCESSTOKEN;

app.get('/api/login', function(request, response) {
  console.log("in login request");
  var url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
  response.redirect(url);
});




app.get('/api/callback', function(request, response) {
  console.log("in callback request");
  console.log('request', request.query);
   uber.authorizationAsync({authorization_code: request.query.code})
   .spread(function(access_token, refresh_token, authorizedScopes, tokenExpiration) {
     // store the user id and associated access_token, refresh_token, scopes and token expiration date
     console.log('New access_token retrieved: ' + access_token);
     console.log('... token allows access to scopes: ' + authorizedScopes);
     console.log('... token is valid until: ' + tokenExpiration);
     console.log('... after token expiration, re-authorize using refresh_token: ' + refresh_token);

     // redirect the user back to your actual app
     response.sendFile(path.join(__dirname + '/index.'));
   })
   .error(function(err) {
     console.error(err);
   });
});





app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
