var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var sendHttpRequest = require('request');
var dotenv = require('dotenv').config();

var Team = require('./Team');

var app = express();
var hostUrl;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGOLAB_URI);

// Construct OAuth handshake URL with API credentials.
function createBaseUrl(host) {
  var hostAuthUrl = encodeURIComponent(path.resolve(host, 'auth'));
  var baseUrl = 'https://slack.com/api/oauth.access'
  + '?client_id=' + process.env.SLACK_CLIENT_ID
  + '&client_secret=' + process.env.SLACK_CLIENT_SECRET
  + '&redirect_uri=' + hostAuthUrl;
  return baseUrl;
}

// handleAuthResponse returns a function with a reference to an HTTP response
//   object. It sends an appropriate response based on error parameter.
// In: Server response.
// Out: Request handler closure.
function handleAuthResponse(response) {
  // In: HTTP request error or null if okay.
  // In: Request result.
  return function(error, result, body) {  
    body = JSON.parse(body);

    if (error !== null || !body.incoming_webhook) {
      response.send('Error, please try again.')
    } else {
      // Access token can be used to identify the team ID if the scope was set.
      var _ = result.body.access_token;

      var t = new Team({
        _id: body.team_id,
        webhook: body.incoming_webhook.url,
      })
      t.save(function(err) {
        if (err) {
          console.error(err)
        } else {
          response.send('Pengo mvp added.')
        }
      })
    }
  }
}

// Set host url at runtime
app.post('/sethost', function(request, response) {
  if (request.body.host_url === undefined) {
    response.json({
      message: 'Error: host url parameter not found'
    });
  } else {
    hostUrl = request.body.host_url;
    response.json({
      message: 'Successfully set ' + hostUrl,
    });
  }
});

// OAuth handshake route endpoint. Makes a request to Slack's API oauth.access,
// which returns without error if the authentication code is correct.
// Our front webpage does not use this. Instead, clicking "Add to Slack"
// sends Slack a permission request that redirects the user to this endpoint.
// This needs to be added to the app's settings at https://api.slack.com/apps
app.get('/auth', function(request, response) {
  // Require an OAuth handshake code to continue.
  if (request.body.code === undefined) {
    return response.redirect('/');
  }
  // Attach the OAuth handshake code to base API URL.
  var authUrl = createBaseUrl(hostUrl) + '&code=' + req.query.code;
  // request lib signature: .get([urlstring], [function callback(error, result){}])
  sendHttpRequest.get(authUrl, handleAuthResponse(response));
});

app.post('/belltower', function(req, res) {
  res.json({
    response_type: 'ephemeral',
    text: 'The time is: ' + (new Date).toLocaleString(),
  });
});

app.listen(port = process.env.PORT || 3750, () => {
  console.log('listening on', port);
});

module.exports = app;