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

const destroyDocuments = async (db, collectionName) => new Promise((res, rej) => {
  db.collection(collectionName, (error, collection) => {
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
    await Promise.all(collections.map(name => destroyDocuments(db, name)));
  } catch (error) { console.error(error); }
  return mongoose.disconnect();
};

module.exports = {
  mocks,
  setup,
  teardown,
  destroyDocuments,
};
