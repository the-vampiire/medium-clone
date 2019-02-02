require('dotenv').config();

const { getDatabaseURI } = require('../utils');
const mocks = require('./mocks');

const dbConnect = (mongoose) => {
  mongoose.set('useCreateIndex', true);
  mongoose.set('useNewUrlParser', true);
  mongoose.connect(getDatabaseURI('test'));
}

const setup = async (models, { userCount }) => {
  const output = {
    users: null,
  };

  output.users = await Promise.all(
    Array(userCount)
    .fill(null)
    .map(() => models.User.create(mocks.userMock())),
  );

  return output;
};

const destroyDocuments = async (db, collectionName) => new Promise((res, rej) => {
  db.collection(collectionName, (error, collection) => {
    if (error) return rej(error);
    return collection.deleteMany({}, (err) => {
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
  dbConnect,
};
