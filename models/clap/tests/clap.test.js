const mongoose = require('mongoose');

const { dbConnect } = require('../../../test-utils');
const { Clap, MAX_CLAP_COUNT } = require('../clap');
const { ObjectId } = mongoose.Types;

describe('Clap Model', () => {
  beforeAll(() => dbConnect(mongoose));
  afterAll(() => mongoose.disconnect());

  test('limits the minimum count value: 1',
  () => Clap.create({
    user: new ObjectId(),
    story: new ObjectId(),
    count: MAX_CLAP_COUNT + 100,
  })
    .then(data => expect(data).not.toBeDefined())
    .catch(({ errors }) => expect(errors.count).toBeDefined()));

  test(`limits the maximum count value set by MAX_CLAP_COUNT constant: ${MAX_CLAP_COUNT}`,
  async () => Clap.create({
    user: new ObjectId(),
    story: new ObjectId(),
    count: MAX_CLAP_COUNT + 100,
  })
    .then(data => expect(data).not.toBeDefined())
    .catch(({ errors }) => expect(errors.count).toBeDefined()));
});
