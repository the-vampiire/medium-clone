require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../index');
const {
  setup,
  teardown,
  mocks: { storyMock, clapMock },
} = require('../../test-utils');
const { buildEndpoint, paginationDefault } = require('../../controllers/utils');
// uncomment to see the mongodb queries themselves for debugging
// mongoose.set('debug', true);
describe('Story Model', () => {
  let author;
  let replier;
  let story;
  let reply;
  let clapsPerUser;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

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

  describe('VIRTUALS', () => {
    describe('.claps', () => {
      let claps;
      beforeAll(async () => {
        story = await story.populate('claps').execPopulate();
        claps = story.claps;
      });

      test('returns all the claps belonging to the story', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(1);

        const [clap] = claps;
        expect(String(clap.user)).toEqual(replier.id);
        expect(String(clap.story)).toEqual(story.id);
      });
    });

    describe('.clappedUserCount', () => {
      let clappedUserCount;
      beforeAll(async () => {
        story = await story.populate('clappedUserCount').execPopulate();
        clappedUserCount = story.toJSON().clappedUserCount;
      });

      test('returns the total number of users who clapped for the story', () => {
        expect(clappedUserCount).toBeDefined();
        expect(clappedUserCount).toBe(1);
      });
    });

    describe('.replies', () => {
      let replies;
      beforeAll(async () => {
        story = await story.populate('replies').execPopulate();
        replies = story.replies;
      });

      test('returns all the replies to the story', () => {
        expect(replies).toBeDefined();
        expect(replies.length).toBe(1);
        expect(replies[0].id).toEqual(reply.id);
      });
    });

    describe('.repliesCount', () => {
      let repliesCount;
      beforeAll(async () => {
        story = await story.populate('repliesCount').execPopulate();
        repliesCount = story.toJSON().repliesCount;
      });

      test('returns the total number of replies to the story', () => {
        expect(repliesCount).toBeDefined();
        expect(repliesCount).toBe(1);
      });

    });

    describe('.slug', () => {
      let slug;
      let expected;
      beforeAll(() => {
        slug = story.slug;
        expected = `${story.title.replace(/ /g, '-').toLowerCase()}-${story.id}`;
      });

      test('returns a URL safe slug generated from the story\'s title', () => {
        expect(slug).toBeDefined();
        expect(slug).toEqual(expected);
      });
    });
  });

  describe('INSTANCE METHODS', () => {
    describe('getClapsCount()', async () => {
      let clapsCount;
      beforeAll(async () => {
        clapsCount = await story.getClapsCount();
      });

      test('returns the total count of all claps from readers', () => {
        const expectedCount = clapsPerUser * 1;
        expect(clapsCount).toEqual(expectedCount);
      });
    });

    describe('getClappedReaders()', () => {
      let clappedReaders;
      beforeAll(async () => {
        clappedReaders = await story.getClappedReaders();
      });

      test('returns a list of the clapped readers [users]', () => {
        expect(clappedReaders).toBeDefined();
        expect(clappedReaders.length).toBe(1);
      });
    });

    describe('publish()', () => {
      beforeAll(async () => {
        story = await story.publish();
      });
      test('sets the publishedDate', () => expect(story.publishedDate).not.toBeNull());
      test('sets the published field to true', () => expect(story.published).toBe(true));
      test('returns null if the story is already published', async () => {
        const nullReturn = await story.publish();
        expect(nullReturn).toBeNull();
      });
    });

    describe('toResponseShape()', () => {
      let output;
      let expectedFields;
      beforeAll(async () => {
        output = await story.toResponseShape(author);
        expectedFields = ['id', 'createdAt', 'updatedAt', 'published', 'publishedDate', 'clapsCount', 'repliesCount', 'author', 'title', 'body', 'resources'];
      });

      test('returns the Story Response Shape, fields: ["id", "createdAt", "updatedAt", "published", "publishedDate", "clapsCount", "repliesCount", "author", "title", "body", "resources"]', () => {
        expect(output).toBeDefined();
        expectedFields.forEach(field => expect(output[field]).toBeDefined());
      });

      test('does not include unused fields: ["__v", "_id", "parent"]', () => {
        ['__v', '_id', 'parent'].forEach(field => expect(output[field]).not.toBeDefined());
      });

      test('author field has correct shape, fields: ["id", "username", "avatarURL", "resources"]', () => {
        const authorField = output.author;
        expect(authorField).toBeDefined();

        ["id", "username", "avatarURL", "resources"]
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
        beforeAll(() => { basePath = `story/${story.slug}`});

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
        
        test(`paginated resources include pagination qs default: ${paginationDefault()}`, () => {
          const hasQSDefault = resourceLink => expect(resourceLink.includes(`?${paginationDefault()}`));
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
