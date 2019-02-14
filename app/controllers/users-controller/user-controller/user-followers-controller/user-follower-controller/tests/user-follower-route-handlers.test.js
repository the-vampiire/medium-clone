const { isFollowingHandler, unfollowUserHandler } = require('../user-follower-route-handlers');

const resMock = {
  json: jest.fn(),
  sendStatus: jest.fn(),
  status: jest.fn(() => resMock),
};

describe('User Follower route handlers', () => {
  describe('isFollowingHandler(): confirms or denies the follower is following the path user', () => {
    afterEach(() => jest.clearAllMocks());

    test('is following: returns a 204 no content response confirmation', async () => {
      const pathFollower = { id: 'followerID' };
      const pathUser = { followers: ['followerID'] };
      const reqMock = { context: { pathUser, pathFollower } };

      await isFollowingHandler(reqMock, resMock);
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });

    test('is not following: returns 404 JSON response { error: not following }', async () => {
      const pathFollower = { id: 'followerID' };
      const pathUser = { followers: [] };
      const reqMock = { context: { pathUser, pathFollower } };

      await isFollowingHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'not following' });
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
