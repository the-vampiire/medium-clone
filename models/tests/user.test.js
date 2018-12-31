require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../index');
const { constants: { MAX_CLAP_COUNT } } = require('../index');
const { setup, teardown, mocks: { storyMock, clapMock } } = require('../../test-utils');

// uncomment to see the mongodb queries themselves for debugging
// mongoose.set('debug', true);
describe('User Model', () => {
  let author;
  let responder;
  let clap;
  let story;
  let unpublishedStory;
  let response;
  let authorResponse;
  let unpublishedResponse;
  let unpublishedAuthorResponse;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 2 });
    [author, responder] = data.users;
    [story, unpublishedStory] = await Promise.all(
      Array(2).fill(null).map((_, i) => models.Story.create(
        storyMock({ author, published: i === 0 })),
      )
    );
    response = await models.Story.create(storyMock({ author: responder, parent: story, published: true }));
    authorResponse = await models.Story.create(storyMock({ author, parent: response, published: true }));
    unpublishedResponse = await models.Story.create(storyMock({ author: responder, parent: story }));
    unpublishedAuthorResponse = await models.Story.create(storyMock({ author, parent: response }));
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  test('usernames are persisted in lowercase', async () => {
    const testUser = await models.User.create({ username: 'ALLCAPS' });
    expect(testUser.username).toEqual('allcaps');
  });

  describe('VIRTUALS', () => {
    describe('.slug', () => {
      let result;
      let expected;
      beforeAll(() => {
        result = author.slug;
        expected = `@${author.username}`;
      });
      test('returns @username slug', () => expect(result).toEqual(expected));
    });

    describe('.claps', () => {
      let claps;
      beforeAll(async () => {
        clap = await models.Clap.create(clapMock({ user: author, story, count: 1 }));
        author = await author.populate('claps').execPopulate();
        claps = author.claps;
      });

      test('returns all the claps the user has made', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(1);
        expect(claps[0].id).toEqual(clap.id);
      });
    });
  });

  describe('INSTANCE METHODS', () => {
    describe('getStories(queryOptions): dynamic getter for stories', () => {
      describe('all published stories (stories + responses) - queryOptions: {}', () => {
        let result;
        beforeAll(async () => { result = await author.getStories({}); });
        test('returns all the author\'s published stories and responses', () => {
          expect(result).toBeDefined();
          expect(result.length).toBe(2);
          const hasCorrectIDs = result.every(story => [story.id, authorResponse.id].includes(story.id));
          expect(hasCorrectIDs).toBe(true);
        });
        test('[DEFAULT - sort published]: descending "publishedAt" order', () => {
          const [first, second] = result;
          expect(Number(first.publishedAt) > Number(second.publishedAt)).toBe(true);
        });
      });
      
      describe('all unpublished stories - queryOptions: { published: false }', () => {
        let result;
        beforeAll(async () => { result = await author.getStories({ published: false }); });
        test('returns all the author\'s unpublished stories and responses', () => {
          expect(result).toBeDefined();
          expect(result.length).toBe(2);
          const hasCorrectIDs = result.every(story => [unpublishedStory.id, unpublishedAuthorResponse.id].includes(story.id));
          expect(hasCorrectIDs).toBe(true);
        });
        test('[DEFAULT - sort unpublished]: descending "updatedAt" order', () => {
          const [first, second] = result;
          expect(Number(first.updatedAt) > Number(second.updatedAt)).toBe(true);
        })
      });
      describe('only published stories - queryOptions: { onlyStories: true }', () => {
        let result;
        beforeAll(async () => { result = await author.getStories({ onlyStories: true }); });
        test('returns the author\'s published stories', () => {
          expect(result).toBeDefined();
          expect(result.length).toBe(1);
          expect(result[0].id).toEqual(story.id);
        });
        test('does not include unpublished stories', () => {
          const includesUnpublished = result.map(story => story.id).includes(unpublishedStory.id);
          expect(includesUnpublished).toBe(false);
        });
      });

      describe('only published responses - queryOptions: { onlyResponses: true }', () => {
        let result;
        beforeAll(async () => { result = await responder.getStories({ onlyResponses: true }); });
        test('returns the user\'s published responses', () => {
          expect(result).toBeDefined();
          expect(result.length).toBe(1);
          expect(result[0].id).toEqual(response.id);
        });
        test('does not include unpublished responses', () => {
          const includesUnpublished = result.map(response => response.id).includes(unpublishedResponse.id);
          expect(includesUnpublished).toBe(false);
        });
      });

      describe('conflicting options - queryOptions: { onlyStories: true, onlyResponses: true }', () => {
        let result;
        beforeAll(async () => { result = await author.getStories({ onlyStories: true, onlyResponses: true }); });
        test('gives precedence to onlyStories, no responses returned', () => {
          expect(result).toBeDefined();
          expect(result.length).toBe(1);
          expect(result[0].id).toEqual(story.id);
        });
      });
    });

    describe('getClappedStories()', () => {
      let result;
      beforeAll(async () => { result = await author.getClappedStories(); });

      test('returns the users clapped stories', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(story.id);
      });
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

  describe('pre-remove hook: cascade delete through associated collections', () => {
    let userStories;
    let userClaps;
    beforeAll(async () => {
      const userOneID = author.id;
      await author.remove();
      userStories = await models.Story.find({ author: userOneID });
      userClaps = await models.Clap.find({ user: userOneID });
    });

    test('cascades to destroy authored stories', () => expect(userStories.length).toBe(0));
    test('cascades to destroy claps made by the user', () => expect(userClaps.length).toBe(0));
  });
});
