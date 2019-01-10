require('dotenv').config();
const mongoose = require('mongoose');

const models = require('../../../models');
const { setup, teardown, mocks: { storyMock } } = require('../../../test-utils');
const {
  userStoriesHandler,
  userFollowingHandler,
  userResponsesHandler,
  userClappedHandler,
} = require('../user-route-handlers');

describe('[/user/@username/] Route Handlers', () => {
  let pathUser;
  let clapped;
  let stories;
  let following;
  let responses;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 4 }).catch(console.error);
    [pathUser, ...following] = data.users;

    const storiesCount = 20;
    stories = await Promise.all(
      Array(storiesCount) // 20 stories
      .fill(null)
      .map(() => models.Story.create(storyMock({ author: pathUser, published: true }))),
    );

    responses = await Promise.all(
      stories
      .slice(0, storiesCount / 2) // 10 responses
      .map(story => models.Story.create(
        storyMock({ author: pathUser, parent: story, published: true }),
      )),
    );

    pathUser.following = following;
    await pathUser.save();

    // todo: refactor
    clapped = await Promise.all(
      stories
      .slice(0, storiesCount / 2)
      .map(story => pathUser.clapForStory(story.id, 10)),
    );
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    await teardown(mongoose, collections);
  });

  describe('[/stories] handler', () => {
    let response;
    let mockRes;
    beforeAll(async () => {
      mockRes = { json: (data) => data };
      response = await userStoriesHandler({ pathUser, query: {} }, mockRes);
    });

    test('returns the User Stories Response shape, fields: ["stories", "pagination"]', () => {
      expect(response).toBeDefined();
      expect(response.pagination).toBeDefined();
      expect(response.stories).toBeDefined();
    });

    test('returns the first ten (default) published stories authored by the user', () => {
      const { stories } = response;
      expect(stories).toBeDefined();
      expect(stories.length).toBe(10);
      expect(stories.every(story => story.author.id === pathUser.id));
    });
  });
});
