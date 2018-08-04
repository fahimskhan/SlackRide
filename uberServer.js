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
})


var ACCESSTOKEN;

app.get('/api/login', function(request, response) {
  console.log("in login request");
  var url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
  response.redirect(url);
});



//Callback request that saves token
app.get('/api/callback', function(request, response) {
  console.log("in callback request");
  console.log('request', request.query);
   uber.authorizationAsync({authorization_code: request.query.code})
   .spread(function(access_token, refresh_token, authorizedScopes, tokenExpiration) {
     // store the user id and associated access_token, refresh_token, scopes and token expiration date
     ACCESSTOKEN= access_token;
     console.log('New access_token retrieved: ' + access_token);
     console.log('... token allows access to scopes: ' + authorizedScopes);
     console.log('... token is valid until: ' + tokenExpiration);
     console.log('... after token expiration, re-authorize using refresh_token: ' + refresh_token);

     // redirect the user back to your actual app
     response.sendFile(path.join(__dirname + '/index.html'));
   })
   .error(function(err) {
     console.error(err);
   });
});
//return user information
// 37.771544
// -122.4098082
app.get('/api/me', function(req, res){
  uber.user.getProfileAsync()
  .then(function(response){
    res.send(response);
  })
  .catch( (err)=> console.log(err));
})

//localhost:3000/api/products/?lat=37.771544&lng=37.771544
// ?strID=XXXX&strName=yyyy&strDate=zzzzz

//list products available near a start location
app.get('/api/products', function(request, response) {
  //this works if you pass params lat and lng like http://localhost:3000/api/products/?lat=37.771544&lng=-122.4098082
  var testLat = request.query.lat;
  var testLng = request.query.lng;
  var lat = 37.771544;
  var lng = -122.40978020000001;
  console.log("lat and lng from products route: ", lat, lng);
  // if no query params sent, respond with Bad Request
  if (!lat || !lng) {
    response.sendStatus(400);
  } else {
    //get all products
    uber.products.getAllForLocationAsync(lat, lng)
    .then(function(res) {
      //what do we want to do with the product list??
      //returns an object with "products" key with value of an array of objects with the uber proucts
      response.send(res);
    })
    .error(function(err) {
      console.error(err);
      response.sendStatus(500);
    });
  }
});

// app.get('/api/getproducts', function(request, response) {
//   uber.products.getAllForAddressAsync('1455 Market St, San Francisco, CA 94103, US')
// .then(function(res) {
//    console.log(res);
//
//  })
// .error(function(err) {
//   console.error(err);
// });
// })



app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
