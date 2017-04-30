var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/auth', function(req, res) {

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