const { exchangeSlugForFollower, requireFollowOwnership } = require('../user-follower-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

describe('User Followers middleware', () => {
  describe('exchangeSlugForFollower(): validates and injects req.context.pathFollower', () => {
    const models = { User: { findOne: jest.fn() } };
    afterEach(() => jest.clearAllMocks());

    test('valid follower: injects req.context.pathFollower and calls next()', async () => {
      const followerSlug = '@the-werewolf';
      const follower = { id: 'followerID' };
      const pathUser = { followers: ['followerID'] };
      models.User.findOne.mockImplementation(() => follower);
      const reqMock = { context: { pathUser, models }, params: { followerSlug } };

      await exchangeSlugForFollower(reqMock, resMock, nextMock);
      expect(reqMock.context.pathFollower).toEqual(follower);
      expect(nextMock).toHaveBeenCalled();
    });

    test('invalid user slug: returns 400 JSON response { error: invalid user slug }', async () => {
      const followerSlug = 'the-werewolf';
      const reqMock = { context: {}, params: { followerSlug } };
      
      await exchangeSlugForFollower(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'invalid user slug' });
    });

    test('follower not found: returns 400 JSON response { error: follower not found }', async () => {
      const followerSlug = '@the-werewolf';
      models.User.findOne.mockImplementation(() => null);
      const reqMock = { context: { models }, params: { followerSlug } };

      await exchangeSlugForFollower(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'follower not found' });
    });

    test('follower is not following path user: returns 404 JSON response { error: not following }', async () => {
      const followerSlug = '@the-werewolf';
      const follower = { id: 'followerID' };
      const pathUser = { followers: [] };
      models.User.findOne.mockImplementation(() => follower);
      const reqMock = { context: { pathUser, models }, params: { followerSlug } };

      await exchangeSlugForFollower(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'not following' });
    });
  });

  describe('requireFollowOwnership(): verifies the follower is the authed user', () => {
    const authedUser = { slug: '@the-vampiire' };
    afterEach(() => jest.clearAllMocks());

    test('authed user matches follower slug: calls next()', () => {
      const followerSlug = '@the-vampiire';
      const reqMock = { context: { authedUser }, params: { followerSlug } };

      requireFollowOwnership(reqMock, resMock, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });

    test('authed user does not match follower slug: returns 403 JSON response { error: follow ownership required }', () => {
      const followerSlug = '@the-werewolf';
      const reqMock = { context: { authedUser }, params: { followerSlug } };

      requireFollowOwnership(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(403);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'follow ownership required' });
    });
  });
});