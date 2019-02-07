const { extractStoryID } = require('../story-controller-utils');
const { exchangeSlugForStory } = require('../story-controller-middleware');

jest.mock('../story-controller-utils', () => ({ extractStoryID: jest.fn() }));

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const StoryMock = { findById: jest.fn() };

const reqMockBase = { models: { Story: StoryMock } };

describe('Story Controller middleware', () => {
  afterEach(() => jest.clearAllMocks());

  describe('exchangeSlugForStory', () => {
    test('storySlug does not contain a valid story ID: 400 JSON response { error: "invalid story slug" }', async () => {
      const reqMock = { ...reqMockBase, params: { storySlug: 'im-a-bad-sluggie' } };
      extractStoryID.mockImplementation(() => null);

      await exchangeSlugForStory(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'invalid story slug' });
    });

    test('story is not found: 404 JSON response { error: "story not found" }', async () => {
      const reqMock = { ...reqMockBase, params: { storySlug: 'a-good-sluggie-thisIsAnIdISwear' } };
      extractStoryID.mockImplementation(() => true);
      StoryMock.findById.mockImplementation(() => null);

      await exchangeSlugForStory(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'story not found' });

    });

    test('story is found from slug: next() called and req.pathStory contains matching Story', async () => {
      const mockStory = { id: 'aRealId' };
      const reqMock = { ...reqMockBase, params: { storySlug: 'the-best-sluggie-andAnId' } };
      extractStoryID.mockImplementation(() => mockStory.id);
      StoryMock.findById.mockImplementation(() => mockStory);

      const nextMock = jest.fn();

      await exchangeSlugForStory(reqMock, null, nextMock);
      expect(StoryMock.findById).toHaveBeenCalledWith(mockStory.id);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.pathStory).toBe(mockStory)
    });
  });
});
