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
  let userOne;
  let userTwo;
  let story;
  let reply;
  let clapsPerUser;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 2 });
    [userOne, userTwo] = data.users;
    story = await models.Story.create(storyMock({ author: userOne }));
    reply = await models.Story.create(storyMock({ author: userOne, parent: story }));

    clapsPerUser = 20;
    await Promise.all(
      [userOne, userTwo].map(user => models.Clap.create({ user, story, count: clapsPerUser })),
    );
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
        expect(claps.length).toBe(2);
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
        expect(clappedUserCount).toBe(2);
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
        const expectedCount = clapsPerUser * 2;
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
        expect(clappedReaders.length).toBe(2);
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

    // describe('toResponseShape()', () => {

    // });

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
        let basePath;
        beforeAll(() => { basePath = `story/${reply.slug}`});

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
        
        test(`paginated resources include pagination qs default: ?${paginationDefault()}`, () => {
          const hasQSDefault = resourceLink => expect(resourceLink.includes(`?${paginationDefault()}`));
          expectedFields.slice(2).forEach(field => {
            const url = replyOutput[field];
            if (url) hasQSDefault(url);
          });
        });
      });
    });
  });
});
