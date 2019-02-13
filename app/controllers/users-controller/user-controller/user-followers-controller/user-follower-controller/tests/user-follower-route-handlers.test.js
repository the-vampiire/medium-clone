const { isFollowingHandler, unfollowUserHandler } = require('../user-follower-route-handlers');

const resMock = {
  json: jest.fn(),
  sendStatus: jest.fn(),
  status: jest.fn(() => resMock),
};

describe('User Follower route handlers', () => {
  describe('isFollowingHandler(): confirms or denies the follower is following the path user', () => {
    const models = { User: { findOne: jest.fn() } };
    
    afterEach(() => jest.clearAllMocks());

    test('is following: returns a 204 no content response confirmation', async () => {
      const followerSlug = '@the-werewolf';
      const follower = { id: 'followerID' };
      const pathUser = { followers: ['followerID'] };
      models.User.findOne.mockImplementation(() => follower);
      const reqMock = { context: { pathUser, models }, params: { followerSlug } };

      await isFollowingHandler(reqMock, resMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });

    test('is not following: returns 404 JSON response { error: not following }', async () => {
      const followerSlug = '@the-werewolf';
      const follower = { id: 'followerID' };
      const pathUser = { followers: [] };
      models.User.findOne.mockImplementation(() => follower);
      const reqMock = { context: { pathUser, models }, params: { followerSlug } };

      await isFollowingHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'not following' });
    });

    test('invalid user slug: returns 400 JSON response { error: invalid user slug }', async () => {
      const followerSlug = 'the-werewolf';
      const reqMock = { context: {}, params: { followerSlug } };
      
      await isFollowingHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'invalid user slug' });
    });

    test('follower not found: returns 400 JSON response { error: follower not found }', async () => {
      const followerSlug = '@the-werewolf';
      models.User.findOne.mockImplementation(() => null);
      const reqMock = { context: { models }, params: { followerSlug } };

      await isFollowingHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'follower not found' });
    });
  });

  describe('unfollowUserHandler(): supports the authed user unfollowing the path user', () => {
    const pathUser = {};
    const authedUser = { unfollowUser: jest.fn() };
    const reqMock = { context: { authedUser, pathUser } };

    afterEach(() => jest.clearAllMocks());

    test('successful unfollow: returns a 204 no content response', async () => {

      await unfollowUserHandler(reqMock, resMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });

    test('error durin unfollowing: returns a JSON response with error.status and error.message', async () => {
      const error = { status: 400, message: 'failure' };
      authedUser.unfollowUser.mockImplementation(() => { throw error; });

      await unfollowUserHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(error.status);
      expect(resMock.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
