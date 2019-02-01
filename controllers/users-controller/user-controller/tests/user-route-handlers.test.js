const mongoose = require('mongoose');

const models = require('../../../../models');
const { dbConnect, setup, teardown, mocks: { storyMock } } = require('../../../../test-utils');
const routeHandlers = require('../user-route-handlers');

describe('[/user/@username] Route Handlers', () => {
  let pathUser;
  let clapped;
  let stories;
  let following;
  let responses;
  beforeAll(async () => {
    dbConnect(mongoose);

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
    let mockRes;
    let routeResponse;
    beforeAll(async () => {
      mockRes = { json: (data) => data };
      routeResponse = await routeHandlers.stories({ pathUser, query: {} }, mockRes);
    });

    test('returns the User Stories Response shape, fields: ["stories", "pagination"]', () => {
      expect(routeResponse).toBeDefined();
      expect(routeResponse.stories).toBeDefined();
      expect(routeResponse.pagination).toBeDefined();
    });

    test('returns the first ten (default) published stories authored by the user', () => {
      const { stories } = routeResponse;
      expect(stories).toBeDefined();
      expect(stories.length).toBe(10);
      expect(stories.every(story => story.author.id === pathUser.id));
    });
  });

  describe('[/responses] handler', () => {
    let mockRes;
    let routeResponse;
    beforeAll(async () => {
      mockRes = { json: data => data };
      routeResponse = await routeHandlers.responses({ pathUser, query: {} }, mockRes);
    });

    test('returns the User story Responses Response shape, fields: ["responses", "pagination"]', () => {
      expect(routeResponse).toBeDefined();
      expect(routeResponse.responses).toBeDefined();
      expect(routeResponse.pagination).toBeDefined();
    });

    test('returns the first ten (default) published responses authored by the user', () => {
      const { responses } = routeResponse;
      expect(responses).toBeDefined();
      expect(responses.length).toBe(10);
      expect(responses.every(response => response.author.id === pathUser.id));
    });
  });
});
