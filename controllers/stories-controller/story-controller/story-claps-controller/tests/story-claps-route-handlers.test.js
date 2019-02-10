const { newResourceResponse } = require('../../../../controller-utils');
const { clappedReadersHandler, clapForStoryHandler } = require('../story-claps-route-handlers');

jest.mock('../../../../controller-utils', () => ({ newResourceResponse: jest.fn() }));

const resMock = {
  json: jest.fn(),
  status: jest.fn(() => resMock),
};

describe('Story Claps route handlers', () => {
  describe('clappedReadersHandler(): retrieves a paginable list of the story\'s clapped readers', () => {
    const readers = [];
    const pagination = {};
    const totalClaps = 200;
    const query = { limit: 5, currentPage: 0 };
    const pathStory = {
      getClapsCount: jest.fn(() => totalClaps),
      getClappedReaders: jest.fn(() => ({ readers, pagination })),
    };
    const reqMock = { pathStory, query };

    beforeAll(() => clappedReadersHandler(reqMock, resMock));  
    afterAll(() => jest.clearAllMocks());
    
    test('retrieves the total claps count for the story', () => {
      expect(pathStory.getClapsCount).toHaveBeenCalled();
    });

    test('retrieves the paginable readers list: passes query params', () => {
      expect(pathStory.getClappedReaders).toHaveBeenCalledWith(query);
    });

    test('returns a JSON response: { totalClaps, readers, pagination }', () => {
      expect(resMock.json).toHaveBeenCalledWith({ totalClaps, readers, pagination });
    });
  });

  describe('clapForStoryHandler(): creates a clap for the authed user and path story', () => {
    const clapMock = { toResponseShape: jest.fn() };
    const authedUser = { clapForStory: jest.fn() };
    const pathStory = { id: 'anID' };
    const totalClaps = 50;
    const body = { totalClaps };

    test('body missing totalClaps param: 400 JSON response { error: "totalClaps required" }', async () => {
      const reqMock = { body: {} };
      
      await clapForStoryHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'totalClaps required' });

      jest.clearAllMocks();
    });

    test('authedUser is story author: 403 JSON response { error: "clapping for author\'s own story" }', async () => {
      const reqMock = { authedUser, pathStory, body };
      authedUser.clapForStory.mockImplementation(() => null);

      await clapForStoryHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(403);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'clapping for author\'s own story' });

      jest.clearAllMocks();
    });

    describe('successful path', () => {
      const reqMock = { authedUser, pathStory, body };
      beforeAll(() => {
        authedUser.clapForStory.mockImplementation(() => clapMock);
        clapForStoryHandler(reqMock, resMock);
      });

      test('calls clapForStory user method: (pathStory.id, totalClaps)', () => {
        expect(authedUser.clapForStory).toHaveBeenCalledWith(pathStory.id, totalClaps);
      });

      test('calls toResponseShape() on the created clap', () => {
        expect(clapMock.toResponseShape).toHaveBeenCalled();
      });

      test('returns newResourceResponse: with urlName: clapURL', () => {
        expect(newResourceResponse).toHaveBeenCalledWith(
          clapMock.toResponseShape(),
          'clapURL',
          resMock,
        );
      });
    });
  });
});
