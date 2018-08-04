//requiring geolocation
var geolocation = require('geolocation');
var firstPass = true;
var NodeGeocoder = require('node-geocoder');
var GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// var boolFalse = true;
var uberServerUrl = 'http://localhost:3000';
var axios = require('axios');
var filteredProducts = null;
var productId = null;
var fare_id = null;

//Google earth locator
var options = {
 provider: 'google',
 httpAdapter: 'https', // Default
 apiKey: GOOGLE_API_KEY, // for Mapquest, OpenCage, Google Premier
 formatter: null         // 'gpx', 'string', ...
};
var geocoder = NodeGeocoder(options);
// geocoder.geocode("Howard St and 9th St", function ( err, data ) {
//   console.log("GOOGLE DATA: ", data)
// });


var products = [];
var milestoneTracker = {
  MS1: false,
  MS2: false,
  confirmation: false
};
var watsonMilestones = {
  login: {
    loggedIn: false,
  },
  MS1: {
    startLat: null,
    startLng: null,
    endLat: null,
    endLng: null,
    startLocation: '',
    endLocation: '',
    numRiders: null,
  },
  MS2: {
    rideType: ''
  },
  confirmation: {
    confirmed: false,
  }
};

var Botkit = require('botkit');
var express = require('express');
var middleware = require('botkit-middleware-watson')({
  username: process.env.ASSISTANT_USERNAME,
  password: process.env.ASSISTANT_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.ASSISTANT_URL || 'https://gateway.watsonplatform.net/assistant/api',
  version: '2018-07-10'
});

// Configure your bot.
var slackController = Botkit.slackbot();
var slackBot = slackController.spawn({
  token: process.env.SLACK_TOKEN
});

var checkMS1 = function (data){
  if (data.context.start_location && data.context.end_location && firstPass){
    var user_input = data.input.text; //whole input string from user
    var fromAddr = user_input.split('(')[1].split(')')[0];
    var toAddr = user_input.split('(')[2].split(')')[0];
    watsonMilestones.MS1.startLocation = fromAddr;
    watsonMilestones.MS1.endLocation = toAddr;
    firstPass = false;

    geocoder.geocode(toAddr)
    .then((data) => {
      return data[0]
    })
    .then((dataObj) => {
      var endLat = dataObj.latitude;
      var endLng = dataObj.longitude;
      watsonMilestones.MS1.endLat = endLat;
      watsonMilestones.MS1.endLng = endLng;
    })
    .catch( (err) => {
      console.log(err);
    })


    geocoder.geocode(fromAddr)
    .then((data) => {
      return data[0]
    })
    .then((dataObj) => {
      var startLat = dataObj.latitude;
      var startLng = dataObj.longitude;
      watsonMilestones.MS1.startLat = startLat;
      watsonMilestones.MS1.startLng = startLng;
      return [startLat, startLng];
    })
    .then((coords) => {
      axios.post(uberServerUrl+'/api/products', {
        startLat: coords[0],
        startLong: coords[1],
      })
      .then( (res) => {
        if (res.status===450){
          console.log('no products found')
        } else if (res.status == 500){
          console.log('error connecting to uber');
        } else {
          products = res.data.products;
          // console.log('unfiltered products:', products)
          filteredProducts = filterProducts(products);
        //   console.log('filtered products: ', filteredProducts);
        }
      })
      .catch( (err) => {
        console.log(err);
      })
    })
    .catch( (err) => {
      console.log(err);
    })
    //lookup and populate coordinates
  }
  if (data.context.no_of_riders){
    watsonMilestones.MS1.numRiders = data.context.no_of_riders;
  }
  if (!watsonMilestones.MS1.startLocation || !watsonMilestones.MS1.endLocation || !watsonMilestones.MS1.numRiders){
    return false;
  }
  return true;
};

var checkMS2 = function (data){
  if (data.context.ride_type){
    watsonMilestones.MS2.rideType = data.context.ride_type;
  }
  if (!watsonMilestones.MS2.rideType){
    return false;
  }
  return true;
};

var filterProducts = function(products){
  var filteredProducts = [];
  for (var i=0; i<products.length; i++){
    var newProduct = {
      type: products[i].display_name,
      product_id: products[i].product_id,
    }
    filteredProducts.push(newProduct);
  }
  return filteredProducts;
}
var requestUber = function(message, bot){
  var type = watsonMilestones.MS2.rideType;
  for (var i=0; i<filteredProducts.length; i++){
    if (filteredProducts[i].type == type){
      productId = filteredProducts[i].product_id;
    }
  };
  axios.post(uberServerUrl+'/api/estimate', {
    productId: productId,
    startLong: watsonMilestones.MS1.startLng,
    startLat: watsonMilestones.MS1.startLat,
    endLong: watsonMilestones.MS1.endLng,
    endLat: watsonMilestones.MS1.endLat,
  })
  .then( (res) => {

    var price = res.data.fare.display;
    fare_id = res.data.fare.fare_id
    var start = watsonMilestones.MS1.startLocation;
    var destination = watsonMilestones.MS1.endLocation;
    bot.reply(message, "Found a " + watsonMilestones.MS2.rideType + " ride from " + start + " to " + destination + " for " + price + ". Do you want me to book it?");

    //find fare_id.
    //find price ("display")
    //bot.send price to user for confirmation.
  })
  .catch( (err) =>{
    console.log(err);
  })
  //find productID from map of products.
  //request ride with productID
  // setTimeout(function(){
  //   bot.reply(message, 'Found your uber');
  // }, 3000);
};

var setWebhook = function(data) {
  console.log('in set webhooks');
  setInterval(()=>{
    axios.post(uberServerUrl+'/api/status')
    .then((res)=>{
      console.log(res.data);
    })
    .catch((error)=>{
      console.log(error)
    })
  }, 4000);
}

var processConfirmation = function(bot, message, data){
  var confirmation = data.context.ride_confirmation;
  if (confirmation === 'yes'){
    axios.post(uberServerUrl+'/api/request',{
      productId: productId,
      fareId: fare_id,
      startLong: watsonMilestones.MS1.startLng,
      startLat: watsonMilestones.MS1.startLat,
      endLat: watsonMilestones.MS1.endLat,
      endLong: watsonMilestones.MS1.endLng
    })
    .then( (res) => {
      console.log(res);
      setWebhook(data);
      bot.reply(message, 'Your ride has been booked! Check uber app to track ride. Thank you for using uber bot!');
    })
    .catch( (err) => {
      console.log(err);
    })
  }
  else{
    watsonMilestones.MS1 = {
      startLat: null,
      startLng: null,
      endLat: null,
      endLng: null,
      startLocation: '',
      endLocation: '',
      numRiders: null,
    };
    watsonMilestones.MS2 = {
      rideType: ''
    };
    watsonMilestones.confirmation = {
      confirmed: false,
    };
    productId = null;
    fare_id = null;
    bot.reply(message, 'Ok, your ride has been canceled! Uber bot is always here to book your next ride!');
  }
}

var checkConfirmation = function(data){
  if (!data.context.ride_confirmation){
    return false
  } else{
    return true;
  }
}

slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  slackController.log('Slack message received');

  if (!watsonMilestones.login.loggedIn){
    // request to /logged
    //console.log('Inside of check');
    axios.get(uberServerUrl+'/api/login')
    .then((res)=>{
      if (res.status==200){
        console.log("200 status on login");
      } else{
        console.log('some other status', res.status);
      }
    })
    .catch((err)=>{
      console.log(err);
    });

    watsonMilestones.login.loggedIn = true;
    bot.reply(message, 'Logged in to uber. How can I help you? (Please enter adresses in perenthesis)');
  } else {
    //console.log('bot', bot);
    //console.log('msg after', message);
    middleware.interpret(bot, message, function() {
      if (message.watsonError) {
        console.log(message.watsonError);
        bot.reply(message, message.watsonError.description || message.watsonError.error);
      } else if (message.watsonData && 'output' in message.watsonData) {
        var data = message.watsonData;
        //console.log('STORAGE', message.watsonData);
        if (checkMS1(data) && !milestoneTracker.MS1){
          milestoneTracker.MS1 = true;
        }
        if (checkMS2(data) && !milestoneTracker.MS2){
          milestoneTracker.MS2 = true;
          requestUber(message, bot);
        }
        if (checkConfirmation(data) && !milestoneTracker.confirmation){ //zzzz potential but if user enters 'yes' or 'no' earlier in the converstaion
          milestoneTracker.confirmation = true;
          processConfirmation(bot, message, data);
        }

        // if (data.context.start_location && data.context.end_location && data.context.ride_type) {
        //   for
        // }
        //series of ifs checking for completed milestones.
        //once milestone is hit, make request to uberServer.js route.
        //else, continue conversation
        bot.reply(message, message.watsonData.output.text.join('\n'));

      } else {
        console.log('Error: received message in unknown format. (Is your connection with Watson Conversation up and running?)');
        bot.reply(message, 'I\'m sorry, but for technical reasons I can\'t respond to your message');
      }
    });
  }
});

slackBot.startRTM();

// Create an Express app
var app = express();
var port = process.env.PORT || 5000;
app.set('port', port);
app.listen(port, function() {
  console.log('Client server listening on port ' + port);
});
