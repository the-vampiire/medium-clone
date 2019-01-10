require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../../index');
const { setup, teardown, mocks: { storyMock } } = require('../../../test-utils');

describe('User Model Instance Methods: Response Data Shapers', () => {
  let author;
  let responder;
  let stories;
  let responses;
  beforeAll(async () => {
    mongoose.set('useCreateIndex', true);
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 2 });
    [author, responder] = data.users;
    stories = await Promise.all(
      Array(30)
        .fill(null)
        .map(() => models.Story.create(storyMock({ author, published: true }))),
    );
    responses = await Promise.all(
      Array(30)
        .fill(null)
        .map(() => models.Story.create(
          storyMock({author: responder, parent: stories[0], published: true }),
        )),
    );
  });
  
  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('toResponseShape(): converts a User document into its Response Shape', () => {
    let output;
    beforeAll(async () => { output = author.toResponseShape(); });
    
    test('returns the User Response Shape, fields: ["id", "username", "avatarURL", "links"]', () => {
      const expected = {
        id: author.id,
        username: author.username,
        avatarURL: author.avatarURL,
        links: author.buildResourceLinks(),
      };
      expect(output).toEqual(expected);
    });
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

  describe('shapeAuthoredStories(stories)', () => {
    let output;
    beforeAll(async () => { output = await author.shapeAuthoredStories(stories); });
    
    test('returns an Array of Story Response shapes (see story.toResponseShape() tests)', () => {
      // not checking entire shape because that is performed in Story tests
      // shapes will have _id fields stripped if transformed correctly
      expect(output.length).toBe(stories.length);
      expect(output[0]._id).not.toBeDefined();
    });
  });

  describe('addPagination(): general [/user/@username] pagination util, see buildPagination() controller-util tests', () => {
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
  });

  describe('addStoriesPagination(): paginating authored stories and story responses', () => {
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

    test('more stories available - hasNext: true', () => {
      expect(output.pagination.hasNext).toBe(true);
    });

    test('end of available stories - hasNext: false', async () => {
      const noNext = await responder.addStoriesPagination({
        stories,
        currentPage: 2 * stories.length,
      });
      expect(noNext.pagination.hasNext).toBe(false);
    });

    describe('behavior with story "responses" instead of "stories" arg', () => {
      let output;
      beforeAll(async () => {
        const options = { responses };
        output = await responder.addStoriesPagination(options);
      });
  
      test('returns the [user/@username/responses] paginated response shape: { responses, pagination }', () => {
        expect(output).toBeDefined();
        expect(output.pagination).toBeDefined();
        expect(output.responses).toBeDefined();
        expect(output.responses.length).toBe(responses.length);
      });

      test('more responses available - hasNext: true', () => {
        expect(output.pagination.hasNext).toBe(true);
      });

      test('end of available responses - hasNext: false', async () => {
        const noNext = await responder.addStoriesPagination({
          responses,
          currentPage: 2 * responses.length,
        });
        expect(noNext.pagination.hasNext).toBe(false);
      });
    });

    describe('passing both "responses" and "stories" arguments', async () => {
      test('gives precedence to stories, returns as if only "stories" arg', () => {
        const mixed = await author.addStoriesPagination({ stories, responses });
        expect(mixed.stories).toBeDefined();
        expect(mixed.responses).not.toBeDefined();
      });
    });
  });
});
