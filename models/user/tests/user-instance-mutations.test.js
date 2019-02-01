const mongoose = require('mongoose');
const models = require('../../index');
const { constants: { MAX_CLAP_COUNT } } = require('../../index');
const { dbConnect, setup, teardown, mocks: { storyMock } } = require('../../../test-utils');

describe('User Model Instance Methods: Mutations', () => {
  let author;
  let responder;
  let story;
  beforeAll(async () => {
    dbConnect(mongoose);

    const data = await setup(models, { userCount: 2 });
    [author, responder] = data.users;
    story = await models.Story.create(storyMock({ author, published: true }));
    response = await models.Story.create(storyMock({ author: responder, parent: story, published: true }));
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('followUser()', () => {
    let result;
    beforeAll(async () => {
      result = await author.followUser(responder.id);
      // refresh the documents
      author = await models.User.findById(author.id);
      responder = await models.User.findById(responder.id);
    });

    test('returns the updated user', () => {
      expect(result).toBeDefined();
      expect(result.id).toEqual(author.id);
    });

    test('adds the followed user to the current user\'s following list', () => {
      expect(author.following.length).toBe(1);
      expect(author.following[0]).toEqual(responder._id);
    });

    test('adds the current user to the followed user\'s followers list', () => {
      expect(responder.followers.length).toBe(1);
      expect(responder.followers[0]).toEqual(author._id);
    });

    test('returns null if the user tries to follow themself', async () => {
      const nullResult = await author.followUser(author.id);
      expect(nullResult).toBeNull();
    });

    test('returns null if the followed user does not exist', async () => {
      const nullResult = await author.followUser(new mongoose.Types.ObjectId());
      expect(nullResult).toBeNull();
    });

    test('returns null if the user is already following the other', async () => {
      const nullResult = await author.followUser(responder.id);
      expect(nullResult).toBeNull();
    });
  });

  describe('clapForStory()', () => {
    const createUserClap = async (user, story, totalClaps) => {
      await user.clapForStory(story.id, totalClaps);
      const updatedUser = await responder.populate('claps').execPopulate();
      const userClaps = updatedUser.claps;

      return { user: updatedUser, userClaps };
    }

    test('returns null of totalClaps is negative', async () => {
      const nullResult = await responder.clapForStory(story.id, -100);
      expect(nullResult).toBeNull();
    });

    describe('new story clap', () => {
      let initialClapCount;
      let userTwoClaps;
      beforeAll(async () => {
        initialClapCount = 15;
        const data = await createUserClap(responder, story, initialClapCount);
        responder = data.user;
        userTwoClaps = data.userClaps;
      });

      test('creates a new story clap for the reader (user)', () => {
        expect(userTwoClaps).toBeDefined();
        expect(userTwoClaps.length).toBe(1);
        expect(userTwoClaps[0].story).toEqual(story._id);
      });

      test('sets the total clap count', () => {
        expect(userTwoClaps[0].count).toBe(initialClapCount);
      });
    });

    describe('existing story clap: updating clap count', () => {
      let updatedClapCount;
      let userTwoClaps;
      beforeAll(async () => {
        updatedClapCount = 40;
        const data = await createUserClap(responder, story, updatedClapCount);
        responder = data.user;
        userTwoClaps = data.userClaps;
      });

      test('does not create a new story clap', () => {
        expect(userTwoClaps).toBeDefined();
        expect(userTwoClaps.length).toBe(1);
        expect(userTwoClaps[0].story).toEqual(story._id);
      });

      test('updates the clap count of the existing story clap', () => {
        expect(userTwoClaps[0].count).toBe(updatedClapCount);
      });

      test(`limits the total clap count to MAX_CLAP_COUNT constant: ${MAX_CLAP_COUNT}`, async () => {
        const excessClapCount = MAX_CLAP_COUNT + 100;
        const { userClaps } = await createUserClap(responder, story, excessClapCount);
        
        expect(userClaps.length).toBe(1);
        expect(userClaps[0].count).toBe(MAX_CLAP_COUNT);
      });
    });
  });

  describe('respondToStory()', () => {
    let storyResponse;
    beforeAll(async () => { storyResponse = await author.respondToStory(story.id, 'test body') });
    afterAll(async () => { await storyResponse.remove(); });

    test('creates and returns a new response Story', () => {
      expect(storyResponse).toBeDefined();
      expect(storyResponse.parent._id).toEqual(story._id);
      expect(storyResponse.author._id).toEqual(author._id);
    });
  });
});
