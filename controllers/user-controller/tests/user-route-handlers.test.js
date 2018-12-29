require('dotenv').config();
const mongoose = require('mongoose');

const {
  userStoriesHandler,
  userFollowingHandler,
  userResponsesHandler,
  userClappedHandler,
} = require('../user-route-handlers');
const models = require('../../../models');
const {
  setup,
  teardown,
  mocks: {
    storyMock,
    clapMock,
  },
} = require('../../../test-utils');

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

    const storiesCount = 10;
    stories = await Promise.all(
      Array(storiesCount) // 10 stories
      .fill(null)
      .map(() => models.Story.create(storyMock({ author: pathUser, published: true }))),
    );

    responses = await Promise.all(
      stories
      .slice(0, storiesCount / 2) // 5 responses
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

    test('pagination results can be followed until "nextPageURL" is null', async () => {
      let limit = 10;
      let currentPage = 0;
      while (currentPage !== null) {
        output = await userStoriesHandler({ pathUser, query: { limit, currentPage }}, mockRes);
        expect(output.stories.length).toBeGreaterThan(0);
        currentPage = output.pagination.nextPage;
      }
    });
  });
});
