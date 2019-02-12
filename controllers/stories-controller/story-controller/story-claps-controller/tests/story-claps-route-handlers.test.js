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
    const clapsCount = 200;
    const query = { limit: 5, currentPage: 0 };
    const pathStory = {
      getClapsCount: jest.fn(() => clapsCount),
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

    test('returns a JSON response: { clapsCount, readers, pagination }', () => {
      expect(resMock.json).toHaveBeenCalledWith({ clapsCount, readers, pagination });
    });
  });

  describe('clapForStoryHandler(): creates a clap for the authed user and path story', () => {
    const clapMock = { toResponseShape: jest.fn() };
    const authedUser = { clapForStory: jest.fn() };
    const pathStory = { id: 'anID' };
    const count = 50;
    const body = { count };

    test('body missing count param: 400 JSON response { error: "claps count required" }', async () => {
      const reqMock = { body: {} };
      
      await clapForStoryHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'claps count required' });

      jest.clearAllMocks();
    });

    test('authedUser is story author: 403 JSON response { error: "author clapping for own story" }', async () => {
      const reqMock = { authedUser, pathStory, body };
      authedUser.clapForStory.mockImplementation(() => { throw { status: 403, message: 'author clapping for own story' } });

      await clapForStoryHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(403);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'author clapping for own story' });

      jest.clearAllMocks();
    });

    describe('successful path', () => {
      const reqMock = { authedUser, pathStory, body };
      beforeAll(async () => {
        authedUser.clapForStory.mockImplementation(() => clapMock);
        await clapForStoryHandler(reqMock, resMock);
      });

      test('calls clapForStory user method: (pathStory.id, count)', () => {
        expect(authedUser.clapForStory).toHaveBeenCalledWith(pathStory.id, count);
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
