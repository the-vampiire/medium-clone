require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../../index');
const { setup, teardown, mocks: { storyMock, clapMock } } = require('../../../test-utils');

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
    beforeAll(async () => {
      await models.Clap.create(clapMock({ user: author, story, count: 20 }));
      result = await author.getClappedStories();
    });

    test('returns the users clapped stories', () => {
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].id).toEqual(story.id);
    });
  });

  describe('validatePassword()', () => {
    let user;
    const password = 'the super secret one';
    beforeAll(async () => { user = await models.User.create({ username: 'the-vampiire', password }); });

    test('returns true if the correct password is passed', async () => {
      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });

    test('returns false if the incorrect password is passed', async () => {
      const isValid = await user.verifyPassword('this aint it chief');
      expect(isValid).toBe(false);
    });
  });
});
