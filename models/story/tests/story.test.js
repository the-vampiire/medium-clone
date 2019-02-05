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

    describe('buildResourceLinks()', () => {
      let storyOutput;
      let replyOutput;
      let expectedFields;
      beforeAll(async () => {
        storyOutput = await story.buildResourceLinks();
        replyOutput = await reply.buildResourceLinks();

        expectedFields = ['storyURL', 'parentURL', 'repliesURL', 'clappedUsersURL'];
      });

      describe('called on a Story', () => {
        let basePath;
        beforeAll(() => { basePath = `stories/${story.slug}`});

        test('returns the Story Resource Links shape, fields: ["storyURL", "parentURL", "repliesURL", "clappedUsersURL"]', () => {
          expect(storyOutput).toBeDefined();
          expectedFields.forEach(field => expect(storyOutput[field]).toBeDefined());
        });

        test('story has no parent: parentURL field is null', () => expect(storyOutput.parentURL).toBeNull());
        
        test('story has a reply: repliesURL field links to correct endpoint', () => {
          const expected = buildEndpoint({ basePath, path: 'replies', paginated: true });
          expect(storyOutput.repliesURL).toEqual(expected);
        });
        
        test('story has clapped users: clappedUsersURL field links to correct endpoint', () => {
          const expected = buildEndpoint({ basePath, path: 'clapped', paginated: true });
          expect(storyOutput.clappedUsersURL).toEqual(expected);
        });
        
        test(`paginated endpoints include pagination qs default: ${paginationQueryString({})}`, () => {
          // idea: use regex (\?limit=[0-9]+&currentPage=[0-9]+)$
          // more brittle than includes() but doesnt guarantee it appears at end of url
          // can slice to `?` then test equality
          const hasQSDefault = resourceLink => expect(resourceLink.includes(`?${paginationQueryString({})}`));
          expectedFields.slice(2).forEach(field => {
            const url = storyOutput[field];
            if (url) hasQSDefault(url);
          });
        });
      });

      describe('called on a reply Story', () => {
        test('returns the Story Resource Links shape, fields: ["storyURL", "parentURL", "repliesURL", "clappedUsersURL"]', () => {
          expect(replyOutput).toBeDefined();
          expectedFields.forEach(field => expect(replyOutput[field]).toBeDefined());
        });

        test('reply has a Story parent: parentURL field links to correct endpoint', () => {
          const expected = buildEndpoint({ basePath: `story/${story.slug}` });
          expect(replyOutput.parentURL).toEqual(expected);
        });
        
        test('reply has no replies: repliesURL field is null', () => {
          expect(replyOutput.repliesURL).toBeNull();
        });
        
        test('reply has no clapped users: clappedUsersURL field is null', () => {
          expect(replyOutput.clappedUsersURL).toBeNull();
        });
      });
    });
  });
});
