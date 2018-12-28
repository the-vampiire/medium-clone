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

    const storiesCount = 15;
    stories = await Promise.all(
      Array(storiesCount)
      .fill(null)
      .map(() => models.Story.create(storyMock({ author: pathUser }))),
    );

    responses = await Promise.all(
      stories
      .slice(0, storiesCount / 2)
      .map(story => models.Story.create(storyMock({ author: pathUser, parent: story }))),
    );

    pathUser.following = following;
    await pathUser.save();

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
    beforeAll(async () => {
      const mockRes = { json: (data) => data };
      response = await userStoriesHandler({ pathUser }, mockRes);
    });

    test('returns an Array of Story response shaped objects', () => {

    });

    test('includes the Story resource links object', () => {

    });

    test('includes the author\'s User resource links object', () => {

    });

    test('returns the first ten stories authored by the user', () => {
      expect(response).toBeDefined();
      expect(response.length).toBe(stories.length + responses.length);
      expect(response.every(story => story.author.id === pathUser.id));
    });

    test('does not include unpublished stories', () => {
      expect(true).toBe(true);
    });

    describe('paginating the user\'s stories', () => {

    });
  });
});
