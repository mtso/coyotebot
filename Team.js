var mongoose = require('mongoose');

var TeamSchema = new mongoose.Schema({
  _id: String,
  webhook: String,
});

module.exports = mongoose.model('team', TeamSchema);