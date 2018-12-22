require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../index');
const {
  setup,
  teardown,
  mocks: { storyMock, clapMock },
} = require('../../test-utils');

// uncomment to see the mongodb queries themselves for debugging
// mongoose.set('debug', true);
describe('User Model', () => {
  let userOne;
  let userTwo;
  let story;
  let clap;
  let response;
  beforeAll(async () => {
    const { MONGO_URI, MONGO_DB } = process.env;
    mongoose.connect(`${MONGO_URI}${MONGO_DB}`, { useNewUrlParser: true });

    const data = await setup({ userCount: 2 });
    [userOne, userTwo] = data.users;
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('virtuals', () => {
    describe('stories', () => {
      let stories;
      beforeAll(async () => {
        story = await models.Story.create(storyMock({ author: userOne }));
        userOne = await userOne.populate('stories').execPopulate();
        stories = userOne.stories;
      });

      test('returns all stories user is an author of', () => {
        expect(stories).toBeDefined();
        expect(stories.length).toBe(1);
        expect(stories[0].id).toEqual(story.id);
      });
    });

    describe('claps', () => {
      let claps;
      beforeAll(async () => {
        clap = await models.Clap.create(clapMock({ user: userOne, story }));
        userOne = await userOne.populate('claps').execPopulate();
        claps = userOne.claps;
      });

      test('returns all the claps the user has made', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(1);
        expect(claps[0].id).toEqual(clap.id);
      });
    });
  });

  describe('instance methods', () => {
    describe('getStories()', () => {
      let result;
      beforeAll(async () => { result = await userOne.getStories({}); });

      test('returns the users stories', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(story.id);
      })
    });

    describe('getResponses()', () => {
      let result;
      beforeAll(async () => {
        response = await models.Story.create(storyMock({ author: userOne, parent: story }));
        result = await userOne.getResponses({});
      });

      test('returns the users responses', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(response.id);
      })
    });

    describe('getClaps()', () => {
      let result;
      beforeAll(async () => { result = await userOne.getClaps({}); });

      test('returns the users claps', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(clap.id);
      })
    });

    describe('followUser()', () => {
      let result;
      beforeAll(async () => {
        result = await userOne.followUser(userTwo.id);
        // refresh the documents
        userOne = await models.User.findById(userOne.id);
        userTwo = await models.User.findById(userTwo.id);
      });

      test('returns the updated user', () => {
        expect(result).toBeDefined();
        expect(result.id).toEqual(userOne.id);
      });

      test('adds the followed user to the current user\'s following list', () => {
        expect(userOne.following.length).toBe(1);
        expect(userOne.following[0]).toEqual(userTwo._id);
      });

      test('adds the current user to the followed user\'s followers list', () => {
        expect(userTwo.followers.length).toBe(1);
        expect(userTwo.followers[0]).toEqual(userOne._id);
      });

      test('returns null if the user tries to follow themself', async () => {
        const nullResult = await userOne.followUser(userOne.id);
        expect(nullResult).toBeNull();
      });

      test('returns null if the followed user does not exist', async () => {
        const nullResult = await userOne.followUser(new mongoose.Types.ObjectId());
        expect(nullResult).toBeNull();
      });
    });
  });

  describe('pre-remove hook: cascade delete through associated collections', () => {
    let userStories;
    let userClaps;
    beforeAll(async () => {
      const userOneID = userOne.id;
      await userOne.remove();
      userStories = await models.Story.find({ author: userOneID });
      userClaps = await models.Clap.find({ user: userOneID });
    });

    test('cascades to destroy authored stories', () => expect(userStories.length).toBe(0));
    test('cascades to destroy claps made by the user', () => expect(userClaps.length).toBe(0));
  });
});
