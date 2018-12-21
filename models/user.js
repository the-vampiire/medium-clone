const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  avatar_url: String,
});

// -- VIRTUALS -- //
userSchema.virtual('stories', {
  ref: 'stories',
  localField: '_id',
  foreignField: 'author',
});

userSchema.virtual('claps', {
  ref: 'claps',
  localField: '_id',
  foreignField: 'user',
});

// -- INSTANCE METHODS -- //
userSchema.methods.getStories = function getStories() {
  return this.populate('stories').execPopulate().then(user => user.stories);
}

userSchema.methods.getResponses = function getResponses() {
  return mongoose.model('stories').find({
    parent: { $ne: null },
    author: this._id,
  });
}

userSchema.methods.getClaps = function getClaps() {
  return this.populate('claps').execPopulate().then(user => user.claps);
}

const User = mongoose.model('users', userSchema);

module.exports = User;
