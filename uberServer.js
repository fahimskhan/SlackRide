const express = require('express');
const bodyParser = require('body-parser')
const app = express();

var Uber = require('node-uber');
var CLIENT_SECRET = process.env.CLIENT_SECRET;

var uber = new Uber({
  client_id: "O8C33qIolVTjUvIUc2VSKr53cGwEYJfg",
  client_secret: CLIENT_SECRET,
  server_token: "QkVbdUtpeEX3FII34_J3BIcwEYO1KoX5bxW6Mws9",
  redirect_uri: 'REDIRECT URL',
  name: 'SlackRide',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true, // optional, defaults to false
  proxy: 'PROXY URL' // optional, defaults to none
})
