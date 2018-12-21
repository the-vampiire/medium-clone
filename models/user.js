const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  avatar_url: String,
  stories: [mongoose.SchemaTypes.ObjectId],
  responses: [mongoose.SchemaTypes.ObjectId],
  claps: [mongoose.SchemaTypes.ObjectId],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
