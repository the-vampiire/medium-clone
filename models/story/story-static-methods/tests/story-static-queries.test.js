const { mocks } = require('../../../../test-utils');
const { getLatestStories } = require('../story-static-queries');

const StoryMock = {
  getLatestStories, // to be tested
  addPagination: jest.fn(), // already tested, can mock
  find: jest.fn(() => StoryMock),
  sort: jest.fn(() => StoryMock),
  limit: jest.fn(() => StoryMock),
  skip: jest.fn(() => []),
};

const storyInstanceMock = (options) => Object.assign(
  mocks.storyMock({ ...options }),
  { toResponseShape() { return this; } }, // already tested, can mock
); 

describe('Story static query methods', () => {
  describe('getLatestStories(): gets the latest published stories', () => {
    const stories = Array(20).fill().map(() => storyInstanceMock({}));

    describe('no query pagination params: uses default values for limit and currentPage', () => {
      const defaultLimit = 10;
      const defaultCurrentPage = 0;
      const expectedStories = stories.slice(0, defaultLimit);

      // define the return value at end of query chain
      StoryMock.skip.mockImplementation(() => expectedStories);
      // spy on the Story instance toResponseShape() to ensure it is called
      const storyToResponseShapeSpy = jest.spyOn(stories[0], 'toResponseShape');

      beforeAll(() => StoryMock.getLatestStories({}));
      afterAll(() => jest.clearAllMocks());

      test('calls find() for only published stories: { published: true, parent: null }', () => {
        expect(StoryMock.find).toHaveBeenCalledWith({ published: true, parent: null });
      });
  
      test('calls sort() to sort in descending publishedAt order: { publishedAt: -1 }', () => {
        expect(StoryMock.sort).toHaveBeenCalledWith({ publishedAt: -1 });
      });
  
      test(`calls limit() using default limit: ${defaultLimit}`, () => {
        expect(StoryMock.limit).toHaveBeenCalledWith(defaultLimit);
      });
  
      test(`calls skip() using <default limit * default currentPage>: ${defaultLimit * defaultCurrentPage}`, () => {
        expect(StoryMock.skip).toHaveBeenCalledWith(defaultLimit * defaultCurrentPage);
      });

      test('calls toResponseShape() on each Story instance found', () => {
        expect(storyToResponseShapeSpy).toHaveBeenCalled();
      });

      test(`calls static addPagination() method with the first ${defaultLimit} stories result: { output: { stories }, limit: ${defaultLimit}, currentPage: ${defaultCurrentPage} }`, () => {
        expect(StoryMock.addPagination).toHaveBeenCalledWith({
          output: { stories: expectedStories },
          limit: defaultLimit,
          currentPage: defaultCurrentPage,
        });
      });
    });

    describe('with query pagination params', () => {
      afterEach(() => jest.clearAllMocks());

      test('executes the previously tested behavior using query param values: { limit: 5, currentPage: 2 }', async () => {
        const limit = 5;
        const currentPage = 2;
        const storyToResponseShapeSpy = jest.spyOn(stories[0], 'toResponseShape');
        const expectedStories = stories.slice(0, limit);

        StoryMock.skip.mockImplementation(() => expectedStories);
  
        await StoryMock.getLatestStories({ limit, currentPage });
        expect(StoryMock.find).toHaveBeenCalledWith({ published: true, parent: null });
        expect(StoryMock.sort).toHaveBeenCalledWith({ publishedAt: -1 });
        expect(StoryMock.limit).toHaveBeenCalledWith(limit);
        expect(StoryMock.skip).toHaveBeenCalledWith(limit * currentPage);
        expect(storyToResponseShapeSpy).toHaveBeenCalled();
        expect(StoryMock.addPagination).toHaveBeenCalledWith({
          limit,
          currentPage,
          output: { stories: expectedStories },
        });
      });

      test('limit value of 500 passed: enforces maximum value of 20 instead', async () => {
        const limit = 500;
        const maxLimit = 20;
        const currentPage = 2;
        StoryMock.skip.mockImplementation(() => stories.slice(0, maxLimit));

        await StoryMock.getLatestStories({ limit, currentPage });
        expect(StoryMock.limit).toHaveBeenCalledWith(maxLimit);
        expect(StoryMock.addPagination).toHaveBeenCalledWith({
          limit: maxLimit,
          currentPage,
          output: { stories: stories.slice(0, maxLimit) },
        });
      });
    });
  });
});
