const mongoose = require('mongoose');
const models = require('../../index');
const { dbConnect, teardown, mocks: { storyMock, clapMock } } = require('../../../test-utils');

describe('User Model: Schema, Virtuals and Hooks', () => {
  let author;
  let clap;
  let story;
  beforeAll(async () => {
    mongoose.set('useCreateIndex', true);
    dbConnect(mongoose);

    story = await models.Story.create(storyMock({ author }));
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  test('usernames are persisted in lowercase', async () => {
    author = await models.User.create({ username: 'ALLCAPS', password: 'irrelevant' });
    expect(author.username).toEqual('allcaps');
  });

  describe('.slug virtual', () => {
    let result;
    let expected;
    beforeAll(() => {
      result = author.slug;
      expected = `@${author.username}`;
    });
    test('returns @username slug', () => expect(result).toEqual(expected));
  });

  describe('.claps virtual', () => {
    let claps;
    beforeAll(async () => {
      clap = await models.Clap.create(clapMock({ reader: author, story, count: 1 }));
      author = await author.populate('claps').execPopulate();
      claps = author.claps;
    });

    test('returns all the claps the user has made', () => {
      expect(claps).toBeDefined();
      expect(claps.length).toBe(1);
      expect(claps[0].id).toEqual(clap.id);
    });
  });

  describe('pre-remove hook: cascade delete through associated collections', () => {
    let userStories;
    let userClaps;
    beforeAll(async () => {
      const userID = author.id;
      await author.remove();
      userStories = await models.Story.find({ author: userID });
      userClaps = await models.Clap.find({ reader: userID });
    });

    test('cascades to destroy authored stories', () => expect(userStories.length).toBe(0));
    test('cascades to destroy claps made by the reader (user)', () => expect(userClaps.length).toBe(0));
  });
});
