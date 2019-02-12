const { newStoryHandler, latestStoriesHandler } = require('../stories-route-handlers');

const resMock = {
  set: jest.fn(),
  json: jest.fn(),
  status: jest.fn(() => resMock),
};

const title ='a title';
const body ='a body';

const authedUserMock = { id: 'anID', username: 'the-vampiire' };

describe('/stories Route Handlers', () => {
  describe('newStoryHandler(): handler for new stories', () => {
    // toResponseShape already tested, can mock
    const responseShapeMock = { links: { storyURL: 'a url' } };
    const storyMock = {
      title,
      body,
      toResponseShape: jest.fn(() => responseShapeMock),
    };
    
    describe('valid story payload', () => {
      beforeAll(async () => {
        jest.clearAllMocks();
        await newStoryHandler(reqMock, resMock);
      });

      const models = { Story: { create: jest.fn(() => storyMock) } };
      const reqMock = { body: { title, body }, context: { authedUser: authedUserMock, models } };

      test('creates a story and converts it to a Story Response Shape', async () => {
        expect(models.Story.create).toHaveBeenCalledWith({ title, body, author: authedUserMock });
        expect(storyMock.toResponseShape).toHaveBeenCalled();
      });

      test('sets Location header to the newly created Story resource URL', () => {
        expect(resMock.set).toHaveBeenCalledWith({ Location: responseShapeMock.links.storyURL });
      });

      test('returns a 201 JSON response with the Story Response Shape', () => {
        expect(resMock.status).toHaveBeenCalledWith(201);
        expect(resMock.json).toHaveBeenCalledWith(storyMock.toResponseShape());
      });
    });

    test('missing title: returns 400 JSON response { error }', async () => {
      jest.clearAllMocks();
      const reqMock = { body: { body }, context: {} };
      
      await newStoryHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'title required' });
    });
  });

  describe('latestStoriesHandler(): handler for paginable querying of recently published stories', () => {
    beforeAll(() => jest.clearAllMocks());
  
    test('returns a JSON response with the result of Story.getLatestStories()', async () => {
      // Story.getLatestStories already tested, can mock
      const StoryMock = { getLatestStories: jest.fn() };
      const reqMock = { query: {}, context: { models: { Story: StoryMock } } };
      
      await latestStoriesHandler(reqMock, resMock);
      expect(StoryMock.getLatestStories).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(StoryMock.getLatestStories());
    });
  });
});