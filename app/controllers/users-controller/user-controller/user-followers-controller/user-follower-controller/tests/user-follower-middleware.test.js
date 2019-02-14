const { exchangeSlugForFollower, requireFollowOwnership } = require('../user-follower-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

describe('User Followers middleware', () => {
  describe('requireFollowOwnership(): verifies the follower is the authed user', () => {
    const authedUser = { id: 'authedID' };
    afterEach(() => jest.clearAllMocks());

    test('authed user matches follower slug: calls next()', () => {
      const pathFollower = { id: 'authedID' };
      const reqMock = { context: { authedUser, pathFollower } };

      requireFollowOwnership(reqMock, resMock, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });

    test('authed user does not match follower slug: returns 403 JSON response { error: follow ownership required }', () => {
      const pathFollower = { id: 'notAuthedID' };
      const reqMock = { context: { authedUser, pathFollower } };

      requireFollowOwnership(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(403);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'follow ownership required' });
    });
  });

  describe('exchangeSlugForFollower(): exchanges the :followerSlug for its corresponding user', () => {
    const models = { User: { findOne: jest.fn() } };

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
  });
});