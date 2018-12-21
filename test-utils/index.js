const { User } = require('../models');
const mocks = require('./mocks');

const setup = async ({ userCount }) => {
  const output = {
    users: null,
  };

  output.users = await Promise.all(
    Array(userCount)
    .fill(null)
    .map(() => User.create(mocks.userMock())),
  );

  return output;
};

const destroyCollection = async (db, name) => new Promise((res, rej) => {
  db.collection(name, (error, collection) => {
    if (error) return rej(error);
    return collection.remove({}, (err) => {
      if (err) return rej(err);
      return res(true);
    });
  });
});

const teardown = async (mongoose, collections) => {
  const { db } = mongoose.connection;
  try {
    await Promise.all(collections.map(name => destroyCollection(db, name)));
  } catch (error) { console.error(error); }
  return mongoose.disconnect();
};

module.exports = {
  mocks,
  setup,
  teardown,
  destroyCollection,
};
