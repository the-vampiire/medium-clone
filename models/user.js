const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  avatar_url: String,
  stories: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Story' }],
  responses: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Story' }],
  claps: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Clap' }],
});

/**
 * with this design we are duplicating data
 * whenever a story is made we have to:
 * assign the user to the author field of the Story
 * assign the story into the stories array of the User
 * 
 * the problem with this is keeping things sychronized.
 * you always want to strive for 0 data duplication.
 * single sources of truth with pointers to that truth are preferable
 * whenever we want to mak a change we affect just the single truth and all
 * other entities that reference it will be synchronized
 */

const User = mongoose.model('User', userSchema);

module.exports = User;
