const {
  userDiscoveryHandler,
  userStoriesHandler,
  userResponsesHandler,
  userClappedStoriesHandler,
} = require('../user-route-handlers');

const resMock = { json: jest.fn() };

describe('User Controller route handlers', () => {
  describe('userDiscoveryHandler(): access an individual User for discovery', () => {
    afterAll(() => jest.clearAllMocks());

    const pathUserMock = { toResponseShape: jest.fn() };
    const reqMock = { context: { pathUser: pathUserMock } };

    test('returns a JSON response of the path user in User Response Shape', () => {
      userDiscoveryHandler(reqMock, resMock);
      expect(pathUserMock.toResponseShape).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(pathUserMock.toResponseShape());
    });
  });

  describe('userStoriesHandler(): paginable requests for authored User stories', () => {
    const stories = [];
    const limit = 5;
    const currentPage = 0;
    const query = { limit, currentPage };
    const pathUserMock = {
      getStories: jest.fn(() => stories),
      shapeAuthoredStories: jest.fn(() => stories),
      addStoriesPagination: jest.fn(() => ({ stories, pagination: query })),
    };
    const reqMock = { query, context: { pathUser: pathUserMock } };

    beforeAll(() => userStoriesHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    test('calls getStories() method for stories using query pagination: { onlyStories: true, limit, currentPage }', () => {
      expect(pathUserMock.getStories).toHaveBeenLastCalledWith({ onlyStories: true, limit, currentPage });
    });

    test('calls shapeAuthoredStories() method using the stories results', () => {
      expect(pathUserMock.shapeAuthoredStories).toHaveBeenLastCalledWith(stories);
    });

    test('calls addStoriesPagination() method using the shaped stories: { stories, limit, currentPage }', () => {
      expect(pathUserMock.addStoriesPagination).toHaveBeenLastCalledWith({ stories, limit, currentPage });
    });

    test('returns a JSON response with the paginated stories: { stories, pagination }', () => {
      expect(resMock.json).toHaveBeenLastCalledWith({ stories, pagination: query });
    });
  });

  describe('userResponsesHandler(): paginable requests for authored User responses', () => {
    const responses = [];
    const limit = 5;
    const currentPage = 0;
    const query = { limit, currentPage };
    const pathUserMock = {
      getStories: jest.fn(() => responses),
      shapeAuthoredStories: jest.fn(() => responses),
      addStoriesPagination: jest.fn(() => ({ responses, pagination: query })),
    };
    const reqMock = { query, context: { pathUser: pathUserMock } };

    beforeAll(() => userResponsesHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    test('calls getStories() method for responses using query pagination: { onlyResponses: true, limit, currentPage }', () => {
      expect(pathUserMock.getStories).toHaveBeenLastCalledWith({ onlyResponses: true, limit, currentPage });
    });

    test('calls shapeAuthoredStories() method using the responses results', () => {
      expect(pathUserMock.shapeAuthoredStories).toHaveBeenLastCalledWith(responses);
    });

    test('calls addStoriesPagination() method using the shaped responses: { responses, limit, currentPage }', () => {
      expect(pathUserMock.addStoriesPagination).toHaveBeenLastCalledWith({ responses, limit, currentPage });
    });

    test('returns a JSON response with the paginated responses: { responses, pagination }', () => {
      expect(resMock.json).toHaveBeenLastCalledWith({ responses, pagination: query });
    });
  });

  describe('userClappedStoriesHandler(): paginable requests for user\'s clapped stories', () => {
    const pathUser = { getClappedStories: jest.fn() };
    const reqMock = { context: { pathUser }, query: {} };
    beforeAll(() => userClappedStoriesHandler(reqMock, resMock));
    
    test('calls getClappedStories() to retrieve the paginated results', () => {
      expect(pathUser.getClappedStories).toHaveBeenCalledWith(reqMock.query);
    });

    test('returns a JSON response with the paginated results', () => {
      expect(resMock.json).toHaveBeenCalledWith(pathUser.getClappedStories());
    });
  });
});
