const { newResourceResponse } = require('../../../controller-utils');
const { storyRepliesHandler, createStoryReplyHandler } = require('../story-replies-handlers');

jest.mock('../../../controller-utils.js', () => ({ newResourceResponse: jest.fn() }));

const resMock = {
  json: jest.fn(),
  status: jest.fn(() => resMock),
};

describe('Story controller /replies handlers', () => {
  describe('storyRepliesHandler(): GET story paginated replies handler', () => {
    beforeAll(() => storyRepliesHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    const query = { limit: 5, currentPage: 3 };
    const pathStory = { getReplies: jest.fn(() => resultsMock) };
    const resultsMock = { replies: [], pagination: {} };
    const reqMock = { pathStory, query };
    
    test('calls getReplies(query) to retrieve paginated results', () => {
      expect(pathStory.getReplies).toHaveBeenCalledWith(query);
    });

    test('returns the JSON response of the paginated replies: { replies, pagination }', () => {
      expect(resMock.json).toHaveBeenCalledWith(resultsMock);
    });
  });

  describe('createStoryReplyHandler(): POST reply creation handler', () => {
    beforeAll(() => createStoryReplyHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());
    
    const body = 'this is the body';
    const pathStory = { id: 'theID' };
    const responseData = { body, links: { url: 'url' } };
    const newReply = { body, toResponseShape: jest.fn(() => responseData) };
    const authedUser = { respondToStory: jest.fn(() => newReply) };
    const reqMock = { pathStory, authedUser, body: { body } };

    test('missing reply body param: 400 JSON response { error: "body required" }', async () => {
      const badReq = { ...reqMock, body: '' };
      
      await createStoryReplyHandler(badReq, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'body required' });
    });

    test('story not found: 404 JSON response { error: "story not found" }', async () => {
      authedUser.respondToStory.mockImplementationOnce(
        () => { throw { status: 404, message: 'story not found' } },
      );

      const errorResMock = { status: jest.fn(() => errorResMock), json: jest.fn() };
      
      await createStoryReplyHandler(reqMock, errorResMock);
      expect(errorResMock.status).toHaveBeenCalledWith(404);
      expect(errorResMock.json).toHaveBeenCalledWith({ error: 'story not found' });
    });

    test('calls authedUser respondToStory() method: (pathStoryID, body)', () => {
      expect(authedUser.respondToStory).toHaveBeenCalledWith(pathStory.id, body);
    });

    test('calls toResponseShape() on new reply story', () => {
      expect(newReply.toResponseShape).toHaveBeenCalled();
    });

    test('returns newResourceResponse(): urlName: "storyURL"', () => {
      expect(newResourceResponse).toHaveBeenCalledWith(responseData, 'storyURL', resMock);
    });
  });
});
