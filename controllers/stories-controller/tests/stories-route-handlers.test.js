const { newStoryHandler, latestStoriesHandler } = require('../stories-route-handlers');

const resMock = {
  status() { return this; },
  json: content => content,
};

const statusSpy = jest.spyOn(resMock, 'status');
const jsonSpy = jest.spyOn(resMock, 'json');

const title ='a title';
const body ='a body';

const authedUserMock = { id: 'anID', username: 'the-vampiire' };

describe('/stories Route Handlers', () => {
  afterEach(() => {
    jsonSpy.mockClear();
    statusSpy.mockClear();
  });

  describe('newStoryHandler(): handler for new stories', () => {
    // toResponseShape already tested, can mock
    const storyMock = { title, body, toResponseShape: jest.fn() };
    
    test('valid Story payload: creates a story and returns a Story Response Shape', async () => {
      const models = { Story: { create: () => storyMock } };
      const reqMock = { body: { title, body }, authedUser: authedUserMock, models };

      await newStoryHandler(reqMock, resMock);
      expect(storyMock.toResponseShape).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(storyMock.toResponseShape());
    });

    test('missing title: returns 400 JSON response { error }', async () => {
      const reqMock = { body: { body } };
      
      await newStoryHandler(reqMock, resMock);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'title required' });
    });
  });

  describe('latestStoriesHandler(): handler for paginable querying of recently published stories', () => {
    test('returns a JSON response with the result of Story.getLatestStories()', async () => {
      // Story.getLatestStories already tested, can mock
      const StoryMock = { getLatestStories: jest.fn() };
      const reqMock = { query: {}, models: { Story: StoryMock } };
      
      await latestStoriesHandler(reqMock, resMock);
      expect(StoryMock.getLatestStories).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(StoryMock.getLatestStories());
    });
  });
});