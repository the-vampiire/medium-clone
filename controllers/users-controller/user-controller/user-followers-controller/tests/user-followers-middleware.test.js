const { requireFollowOwnership } = require('../user-followers-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

describe('User Followers middleware', () => {
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