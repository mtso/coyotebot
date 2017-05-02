var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var sendHttpRequest = require('request');
var dotenv = require('dotenv').config();
var path = require('path');

var Team = require('./Team');

var app = express();
var hostUrl = process.env.HOST_URL;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGOLAB_URI);

// Construct OAuth handshake URL with API credentials.
function createBaseUrl(host) {
  console.log(host)
  var hostAuthUrl = encodeURIComponent(host + '/auth');
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

    console.log(body)

    if (error !== null || !body.incoming_webhook) {
      response.send('Error, please try again.')
    } else {
      // Access token can be used to identify the team ID if the scope was set.
      var _ = result.body.access_token;

      Team.update(
        { _id: body.team_id }, 
        { $set: {webhook: body.incoming_webhook.url} },
        function(err) {
          if (err) {
            console.error(err)
          } else {
            response.send('Pengo mvp added.')
          }
        }
      )
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
  if (!request.query.code) {
    return response.redirect('/');
  }
  // Attach the OAuth handshake code to base API URL.
  var authUrl = createBaseUrl(hostUrl) + '&code=' + request.query.code;
  // request lib signature: .get([urlstring], [function callback(error, result){}])
  sendHttpRequest.get(authUrl, handleAuthResponse(response));
});

app.post('/belltower', function(req, res) {
  makeBelltower(req.body.team_id);

  res.json({
    response_type: 'ephemeral',
    text: 'Started toll at ' + (new Date).toLocaleString(),
  });
});

function makeBelltower(teamId) {
  Team.findOne({_id: teamId}, function(err, res) {
    if (err) {
      return console.error(err)
    }

    let webhook = res.webhook;
    var times = 0;
    var timer;

    timer = setInterval(function() {
      times += 1;
      
      if (times > 5) {
        clearInterval(timer);
      }

      sendHttpRequest.post({
        url: webhook,
        body: {
          text: 'Toll: ' + (new Date).toLocaleString(),
        },
        json: true,
      }, function(err) {})

    }, 1000 * 60)
  })
}

// app.get('/', function(req, res)  {
//   let index = '<a href="https://slack.com/oauth/authorize?&client_id=173004348162.177331434613&scope=commands,incoming-webhook"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>'
// })

app.listen(port = process.env.PORT || 3750, () => {
  console.log('listening on', port);
});

module.exports = app;