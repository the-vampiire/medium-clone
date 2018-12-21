require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../index');
const {
  setup,
  teardown,
  mocks: { storyMock, clapMock },
} = require('../../test-utils');

describe('User Model', () => {
  let user;
  let story;
  let clap;
  let response;
  beforeAll(async () => {
    const { MONGO_URI, MONGO_DB } = process.env;
    mongoose.connect(`${MONGO_URI}${MONGO_DB}`, { useNewUrlParser: true });

    const data = await setup({ userCount: 1 });
    [user] = data.users;
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('virtuals', () => {
    describe('stories', () => {
      let stories;
      beforeAll(async () => {
        story = await models.Story.create(storyMock({ author: user }));
        user = await user.populate('stories').execPopulate();
        stories = user.stories;
      });

      test('returns all stories user is an author of', () => {
        expect(stories).toBeDefined();
        expect(stories.length).toBe(1);
        expect(stories[0]._id).toEqual(story._id);
      });
    });

    describe('claps', () => {
      let claps;
      beforeAll(async () => {
        clap = await models.Clap.create(clapMock({ user, story }));
        user = await user.populate('claps').execPopulate();
        claps = user.claps;
      });

      test('returns all the claps the user is an author of', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(1);
        expect(claps[0]._id).toEqual(clap._id);
      });
    });
  });

  describe('instance methods', () => {
    describe('getStories()', () => {
      let result;
      beforeAll(async () => { result = await user.getStories({}); });

      test('returns the users stories', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0]._id).toEqual(story._id);
      })
    });

    describe('getResponses()', () => {
      let result;
      beforeAll(async () => {
        response = await models.Story.create(storyMock({ author: user, parent: story }));
        result = await user.getResponses({});
      });

      test('returns the users responses', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0]._id).toEqual(response._id);
      })
    });

    describe('getClaps()', () => {
      let result;
      beforeAll(async () => { result = await user.getClaps({}); });

      test('returns the users claps', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0]._id).toEqual(clap._id);
      })
    });
  });
});
