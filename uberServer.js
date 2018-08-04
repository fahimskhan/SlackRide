const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended : false}));
var Uber = require('node-uber');
var path = require('path');
var opn = require('opn');
// var CLIENT_SECRET = process.env.CLIENT_SECRET;
var CLIENT_SECRET = process.env.CLIENT_SECRET
var uber = new Uber({
  client_id: "O8C33qIolVTjUvIUc2VSKr53cGwEYJfg",
  client_secret: CLIENT_SECRET,
  server_token: "QkVbdUtpeEX3FII34_J3BIcwEYO1KoX5bxW6Mws9",
  redirect_uri: 'http://localhost:3000/api/callback',
  name: 'SlackRide',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true, // optional, defaults to false
})
var products = [];
var ACCESSTOKEN;


//    LOGIN USER CALL FROM UBER API. OPENS CONFIRMATION WINDOW
app.get('/api/login', function(request, response) {
  console.log("in login request");
  var url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
  // response.redirect(url);
  opn(url);
});

//  CALLBACK FROM LOGIN. REDIRECTS TO INDEX.HTML, TODO: CLOSE WINDOW
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
     response.sendFile(path.join(__dirname + '/index.html'));
   })
   .error(function(err) {
     console.error(err);
   });
});

//    GRAB USER INFO
app.get('/api/me', function(req, res){
  uber.user.getProfileAsync()
  .then(function(response){
    res.send(response);
  })
  .catch( (err)=> console.log(err));
})


//  LIST PRODUCTS AVAILABLE AT CURRENT LOCATION
// RETURNS IN OBJECT FORMAT WITH KEY "products" and value
// OF AN ARRAY OF OBJECTS
app.post('/api/products', function(request, response) {
  var lat = request.body.startLat;
  var lng = request.body.startLong;
  // if no query params sent, respond with Bad Request
  if (!lat || !lng) {
    response.sendStatus(400);
  } else {
    //get all products
    uber.products.getAllForLocationAsync(lat, lng)
    .then(function(res) {
      //what do we want to do with the product list??
      //returns an object with "products" key with value of an array of objects with the uber proucts
      if (res==null){
        response.status(450).send('No Products Found');
      } else {
        products = res;
        response.send(products);
      }
    })
    .error(function(err) {
      console.error(err);
      response.sendStatus(500);
    });
  }
});

//    ESTIMATE FARE PRICE FROM START LOC TO END LOC.
//    RETURNS PHAT OBJECT WITH KEY "fair_id",   SAVE THIS.
app.post('/api/estimate', function (request, response) {
//grab stuff from request . bodyParser
//fetch(localhost.
  let productId = request.body.productId;
  let startLong = request.body.startLong;
  let startLat = request.body.startLat;
  let endLong = request.body.endLong;
  let endLat = request.body.endLat;
  //make request to uber
  uber.requests.getEstimatesAsync({
    "product_id": productId,
    "start_latitude": startLat,
    "start_longitude": startLong,
    "end_latitude": endLat,
    "end_longitude": endLong
  })
  .then(function(res) {
    //returns object with KEY: "fare_id"
    response.send(res)
  })
  .catch(function(err) {
    console.log("error with estimate", err);
  })
})

app.post('/api/status', function(request, response) {
  console.log('checking status...');
  uber.requests.getCurrentAsync()
  .then((res) => {
      response.send(res);
    })
  .error((err) => {
    response.send(err);
  });
});

//    CALL THIS WITH CHOSEN 'product_id' AND 'fare_id' FROM ABOVE ROUTE CALL
//    THIS ACTUALLY CALLS THE UBER

app.post('/api/request', function(request, response)  {
  //grab stuff from body
  console.log('in top of /request', request.body.productId, request.body.fareId);
  let productId = request.body.productId;
  let fareId = request.body.fareId;
  let startLong = request.body.startLong;
  let startLat = request.body.startLat;
  let endLong = request.body.endLong;
  let endLat = request.body.endLat;
//pass this stuff to uber
  uber.requests.createAsync({
  "fare_id": fareId,
  "product_id": productId,
  "start_latitude": startLat,
  "start_longitude": startLong,
  "end_latitude": endLat,
  "end_longitude": endLong
  })
  .then(function(res) {
    console.log('in then')
    response.send(res);
  })
  .error(function(err) {
    response.send(err);
  });
})


app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
