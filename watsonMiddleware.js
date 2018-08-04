require('dotenv').load();

//requiring geolocation
//var geolocation = require('geolocation');
var firstPass = true;
// var boolFalse = true;
var services = [];
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
    // startLat: null,
    // startLng: null,
    // endLat: null,
    // endLng: null,
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
var findRides = function(){
  ///google earth coordinate Conversation
  //uber request to find services, create
  //for (service in servies){
  // services.push({rideType: ProductId})
// }
  return;
};

var requestUber = function(message, bot){
  //find productID from map of services.
  //request ride with productID
  setTimeout(function(){
    bot.reply(message, 'Found your uber');
  }, 3000);
};

slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  slackController.log('Slack message received');
  //console.log('msg before', message);

  if (!watsonMilestones.login.loggedIn){
    // request to /logged
    //console.log('Inside of check');
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
          findRides();
        }
        if (checkMS2(data) && !milestoneTracker.MS2){
          milestoneTracker.MS2 = true;
          requestUber(message, bot);
        }

        // if (data.context.start_location && data.context.end_location && data.context.ride_type) {
        //   for
        // }
        //series of ifs checking for completed milestones.
        //once milestone is hit, make request to uberServer.js route.
        //else, continue conversation
        console.log('MILESTONE Tracker', milestoneTracker);
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
