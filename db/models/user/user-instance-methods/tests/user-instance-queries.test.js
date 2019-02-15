const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const models = require('../../../index');
const {
  testUtils: { dbConnect, setup, teardown, mocks: { storyMock, userMock } },
} = require('../../../../utils');

describe('User Model Instance Methods: Queries', () => {
  let author;
  let responder;
  let story;
  let response;
  let authorResponse;
  let unpublishedStory;
  let unpublishedResponse;
  let unpublishedAuthorResponse;
  beforeAll(async () => {
    mongoose.set('useCreateIndex', true);
    dbConnect(mongoose);

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

  describe('getClappedStories(): retrieves a paginated list of the reader\'s clapped stories', () => {
    let output;
    const clapCount = 20;
    beforeAll(async () => {
      await models.Clap.create({ reader: author, story, count: clapCount });
      output = await author.getClappedStories({});
    });

    test('returns the paginated shape: { pagination, clapped_stories }', () => {
      expect(output).toHaveProperty('pagination');
      expect(output).toHaveProperty('clapped_stories');
    });

    test('clapped_stories contains expected shape: [{ story, clap }]', () => {
      const clappedStory = output.clapped_stories[0];
      expect(clappedStory).toHaveProperty('story');
      expect(clappedStory).toHaveProperty('clap');
    });

    test('story and clap are in [Story, Clap] Response Shape', () => {
      const clappedStory = output.clapped_stories[0];
      expect(clappedStory.story).toHaveProperty('links');
      expect(clappedStory.clap).toHaveProperty('links');
    });
  });

  describe('validatePassword()', () => {
    let user;
    const password = 'the super secret one';
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash(password, 1);
      user = await models.User.create({ username: 'the-vampiire', password: hashedPassword });
    });

    test('returns true if the correct password is passed', async () => {
      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });

    test('returns false if the incorrect password is passed', async () => {
      const isValid = await user.verifyPassword('this aint it chief');
      expect(isValid).toBe(false);
    });

    test('returns false if undefined is passed as a password', async () => {
      let undefinedPassword;
      const isValid = await user.verifyPassword(undefinedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('getFollowedUsers(): retrieves a paginated list of the users the user is following', () => {
    let output;
    const limit = 5;
    beforeAll(async () => {
      await Promise.all(
        Array(10).fill().map(async () => {
          const user = await models.User.create(userMock({}));
          await author.followUser(user);
        }),
      );

      // refresh the author
      author = await models.User.findById(author.id);
      output = await author.getFollowedUsers({ limit });
    });

    test('returns the paginated shape: { followed_users, pagination }', () => {
      expect(output).toHaveProperty('pagination');
      expect(output).toHaveProperty('followed_users');
    });

    test('followed_users are in User Response Shape', () => {
      expect(output.followed_users[0]).toHaveProperty('links');
    });

    test('only returns the limit amount of followed users', () => {
      expect(output.followed_users.length).toBe(limit);
    });
  });

  describe('getFollowers(): returns a paginated list of the user\'s followers', () => {
    let output;
    const limit = 3;
    const followersCount = 10;
    beforeAll(async () => {
      const followers = await Promise.all(
        Array(followersCount).fill().map(() => models.User.create(userMock({}))),
      );

      author.followers.push(...followers);
      await author.save();

      output = await author.getFollowers({ limit });
    });

    test('returns the paginated shape: { followers, pagination }', () => {
      expect(output).toHaveProperty('followers');
      expect(output).toHaveProperty('pagination');
    });

    test('followers are in User Response Shape', () => {
      expect(output.followers[0]).toHaveProperty('links');
    });

    test('only returns the limit amount of followers', () => {
      expect(output.followers.length).toBe(limit);
    });
  });
});
