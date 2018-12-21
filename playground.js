const mongoose = require('mongoose');

const {
  User,
  Story,
  Clap,
} = require('./models');

const run = async () => {
  // run mongod (mongodb server)
  // run mongo shell and enter: use medium_clone to create the db
  // then run this script
  mongoose.connect('mongodb://127.0.0.1:27017/medium_clone', (error) => { throw new Error(error); });

  const user = await User.create({
    username: 'the-vampiire',
    avatar_url: 'test.com',
  });
  const story = await Story.create({
    title: 'title',
    body: 'body',
    author: user._id,
    parent: null,
  });

  console.log(user);

  console.log(await Story.findById(story.id).populate('author'));
};

run()
.then(() => mongoose.disconnect().then(console.log).catch(console.error))
.catch(console.error);