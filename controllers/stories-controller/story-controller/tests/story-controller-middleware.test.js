const { User, Story } = require('../../../../models');
const { extractStoryID } = require('../story-controller-utils');
const { exchangeSlugForStory, requireAuthorship } = require('../story-controller-middleware');

jest.mock('../story-controller-utils', () => ({ extractStoryID: jest.fn() }));

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

const StoryMock = { findById: jest.fn() };

const reqMockBase = { context: { models: { Story: StoryMock } } };

describe('Story Controller middleware', () => {
  afterEach(() => jest.clearAllMocks());

  describe('exchangeSlugForStory(): exchanges a path story slug for its corresponding story', () => {
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

    test('story is found from slug: next() called and req.context.pathStory contains matching Story', async () => {
      const mockStory = { id: 'aRealId' };
      const reqMock = { ...reqMockBase, params: { storySlug: 'the-best-sluggie-andAnId' } };
      extractStoryID.mockImplementation(() => mockStory.id);
      StoryMock.findById.mockImplementation(() => mockStory);

      await exchangeSlugForStory(reqMock, null, nextMock);
      expect(StoryMock.findById).toHaveBeenCalledWith(mockStory.id);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.context.pathStory).toBe(mockStory)
    });
  });

  describe('requireAuthorship(): enforces authorship authorization of protected Story endpoints', () => {
    const author = new User({ username: 'the-vampiire', password: 'a tough one' });
    const story = new Story({ author: author.id });

    test('authedUser is the author: calls next()', () => {
      const reqMock = { context: { authedUser: author, pathStory: story } };
      
      requireAuthorship(reqMock, resMock, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });

    test('authedUser is not the author: returns 401 JSON response { error: "authorship required" }', () => {
      const notAuthor = new User({ username: 'the-werewolf', password: 'a tough one' });
      const reqMock = { context: { authedUser: notAuthor, pathStory: story } };
      
      requireAuthorship(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(401);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'authorship required' });
    });
  });
});
