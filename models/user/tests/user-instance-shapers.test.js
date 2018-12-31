require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../../index');
const { buildEndpoint } = require('../../../controllers/controller-utils');
const { setup, teardown, mocks: { storyMock } } = require('../../../test-utils');

describe('User Model Instance Methods: Response Data Shapers', () => {
  let author;
  beforeAll(async () => {
    mongoose.set('useCreateIndex', true);
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 1 });
    [author] = data.users;
    stories = await Promise.all(
      Array(30)
        .fill(null)
        .map(() => models.Story.create(storyMock({ author, published: true }))),
    );
  });
  
  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('buildResourceLinks()', () => {
    let output;
    beforeAll(() => { output = author.buildResourceLinks(); });

    test(
      'returns the User Resource Links shape, fields: \
["userURL", "followersURL", "followingURL", "storiesURL", "responsesURL", "clappedStoriesURL"]',
      () => {
        const expectedFields = ["userURL", "followersURL", "followingURL", "storiesURL", "responsesURL", "clappedStoriesURL"];
        expectedFields.forEach(field => expect(output[field]).toBeDefined());
      },
    );
  });

  describe('shapeAuthoredStories', () => {
    let output;
    beforeAll(async () => { output = await author.shapeAuthoredStories(stories); });
    
    test('returns an Array of Story Response shapes (see story.toResponseShape() tests)', () => {
      // not checking entire shape because that is performed in Story tests
      // shapes will have _id fields stripped if transformed correctly
      expect(output.length).toBe(stories.length);
      expect(output[0]._id).not.toBeDefined();
    });
  });

  describe('addPagination(): general [/user/@username] pagination util, consumed by named pagination methods', () => {
    let output;
    beforeAll(() => {
      const options = { output: { payload: 'payload' }, path: 'test', totalDocuments: stories.length };
      output = author.addPagination(options);
    });

    test('adds a "pagination" property to the original output', () => {
      expect(output).toBeDefined();
      expect(output.pagination).toBeDefined();
      expect(output.payload).toEqual('payload');
    });

    test('pagination object has fields: ["limit", "currentPage", "hasNext", "nextPageURL"]', () => {
      const expectedFields = ["limit", "currentPage", "hasNext", "nextPageURL"];
      expectedFields.forEach(field => expect(output.pagination[field]).toBeDefined());
    });

    describe('behavior when there are more docs to paginate: totalDocuments > limit * (currentPage + 1)', () => {
      test('pagination.hasNext is true', () => {
        expect(output.pagination.hasNext).toBe(true);
      });

      test('pagination.nextPageURL has correct endpoint defined', () => {
        const expected = buildEndpoint({
          basePath: `user/${author.slug}`,
          path: 'test',
          limit: 10,
          currentPage: 1, // nextPage (currentPage + 1)
        });
  
        expect(output.pagination.nextPageURL).toEqual(expected);
      });
    });

    describe('behavior when there are no more docs to paginate: totalDocuments > limit * (currentPage + 1)', () => {
      let noNext;
      beforeAll(() => { noNext = author.addPagination({}); });

      test('pagination.hasNext is false', () => {
        expect(noNext.pagination.hasNext).toBe(false);
      });

      test('pagination.nextPageURL is null', () => {
        expect(noNext.pagination.nextPageURL).toBeNull();
      });
    });
  });

  describe('addStoriesPagination(): paginating authored stories', () => {
    let output;
    beforeAll(async () => {
      const options = { stories };
      output = await author.addStoriesPagination(options);
    });

    test('returns the [user/@username/stories] paginated response shape: { stories, pagination }', () => {
      expect(output).toBeDefined();
      expect(output.pagination).toBeDefined();
      expect(output.stories).toBeDefined();
      expect(output.stories.length).toBe(stories.length);
    });

    describe('behavior when there are no more stories to paginate', () => {
      let noNext;
      beforeAll(async () => {
        const options = { limit: 10, currentPage: 2, stories };
        noNext = await author.addStoriesPagination(options);
      });
      test('pagination.hasNext is false', () => expect(noNext.pagination.hasNext).toBe(false));
      test('pagination.nextPageURL is null', () => expect(noNext.pagination.nextPageURL).toBeNull());
    });

    describe('behavior when there are more stories to paginate', () => {
      test('all stories can be paginated over with "nextPageURL" until "pagination.hasNext" is null', async () => {
        let limit = 10;
        let currentPage = 0;
        let paginationCycles = 0;
        let paginatedStories = stories;
        while (currentPage !== null) {
          const paginatedResult = await author.addStoriesPagination({
            limit,
            currentPage,
            stories: paginatedStories,
          });
    
          expect(paginatedResult.stories.length).toBeGreaterThan(0);
          paginatedStories = paginatedResult.stories;
          currentPage = paginatedResult.pagination.hasNext ? currentPage + 1 : null;
          ++paginationCycles;
        }

        expect(paginationCycles * limit).toEqual(stories.length);
      });
    });
  });
});
