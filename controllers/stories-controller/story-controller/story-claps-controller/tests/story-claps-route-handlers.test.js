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
});
