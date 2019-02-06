const controllerUtils = require('../../../../controllers/controller-utils');
const { addPagination } = require('../story-static-shapers');

// mock the controllerUtils.injectPagination function
jest.mock('../../../../controllers/controller-utils.js');

describe('Story static shaper methods', () => {
  describe('addPagination(): adds pagination to a stories query', () => {
    const StoryMock = {
      addPagination,
      countDocuments: () => 5,
    };
    const options = { output: { stories: [], }, limit: 10, currentPage: 2 };
    const countSpy = jest.spyOn(StoryMock, 'countDocuments');

    beforeAll(() => StoryMock.addPagination(options));

    test('calls countDocuments() for published stories only { published: true, parent: null }', () => {
      expect(countSpy).toHaveBeenCalledWith({ published: true, parent: null });
    });

    test('calls injectPagination() util with { basePath: "stories", totalDocuments, ...options }', () => {
      const expected = { basePath: 'stories', totalDocuments: 5, ...options };
      expect(controllerUtils.injectPagination).toHaveBeenCalledWith(expected);
    });
  });
});