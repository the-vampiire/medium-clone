const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const instanceMethods = require('./user-instance-methods');
const { usernameValidator } = require('./validators');

/* MAGIC NUMBER: controls number of salt rounds used during password hashing */
const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
    unique: true,
    set: val => val.toLowerCase(),
    validate: [
      { validator: usernameValidator.validator, msg: usernameValidator.message },
    ],
  },
  password: {
    required: true,
    type: String,
    minlength: [6, "password must be at least 6 characters long"],
  },
  avatarURL: String,
  followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
  following: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
}, { timestamps: true });

// -- VIRTUALS -- //
userSchema.virtual('claps', {
  ref: 'claps',
  localField: '_id',
  foreignField: 'user',
});

userSchema.virtual('slug').get(function () {
  return `@${this.username}`;
});

// == HOOKS -- //
// rule of thumb: the owner model (User) is responsible for cleaning up its owned relations (Story, Clap, Follow)
// User owns: stories, claps, follows
userSchema.pre(
  'remove', // when user [User document instance] has .remove() called on it
  function cascadeDelete() {
    return mongoose.model('stories').deleteMany({ author: this.id })
    .then(() => mongoose.model('claps').deleteMany({ user: this.id }))
  },
);

userSchema.pre(
  'save',
  async function hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }
)

// -- INSTANCE METHODS -- //
for (const [methodName, method] of Object.entries(instanceMethods)) {
  // sets the external methods on the schema, userSchena.methods = methods fails
  userSchema.methods[methodName] = method;
}

const User = mongoose.model('users', userSchema);

module.exports = {
  User,
  SALT_ROUNDS,
};
