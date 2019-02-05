const mongoose = require('mongoose');
const models = require('../../index');
const {
  dbConnect,
  setup,
  teardown,
  mocks: { storyMock },
} = require('../../../test-utils');
const { buildEndpoint, paginationQueryString } = require('../../../controllers/controller-utils');
// uncomment to see the mongodb queries themselves for debugging
// mongoose.set('debug', true);
describe('Story Model', () => {
  let author;
  let replier;
  let story;
  let reply;
  let clapsPerUser;
  beforeAll(async () => {
    dbConnect(mongoose);

    const data = await setup(models, { userCount: 2 });
    [author, replier] = data.users;
    story = await models.Story.create(storyMock({ author }));
    reply = await models.Story.create(storyMock({ author: replier, parent: story }));

    clapsPerUser = 20;
    await replier.clapForStory(story.id, clapsPerUser);
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('INSTANCE METHODS', () => {
    describe('toResponseShape()', () => {
      let output;
      let expectedFields;
      beforeAll(async () => {
        output = await story.toResponseShape();
        expectedFields = ['slug', 'createdAt', 'updatedAt', 'published', 'publishedAt', 'clapsCount', 'repliesCount', 'author', 'title', 'body', 'links'];
      });

      test('returns the Story Response Shape, fields: ["slug", "createdAt", "updatedAt", "published", "publishedAt", "clapsCount", "repliesCount", "author", "title", "body", "links"]', () => {
        expect(output).toBeDefined();
        expectedFields.forEach(field => expect(output[field]).toBeDefined());
      });

      test('does not include unused fields: ["__v", "_id", "parent"]', () => {
        ['__v', '_id', 'parent'].forEach(field => expect(output[field]).not.toBeDefined());
      });

      test('author field has correct shape, fields: ["slug", "username", "avatarURL", "links"]', () => {
        const authorField = output.author;
        expect(authorField).toBeDefined();

        ["slug", "username", "avatarURL", "links"]
          .forEach(field => expect(authorField[field]).toBeDefined());
      });
    });
  });
});
