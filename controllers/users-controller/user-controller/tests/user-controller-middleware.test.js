const mongoose = require('mongoose');

const models = require('../../../../models');
const { setup, teardown, dbConnect } = require('../../../../test-utils');
const { exchangeSlugForUser, userNotFoundRedirect } = require('../user-controller-middleware');

const reqBase = { models }; // base request object
describe('[/user/:@username] Middleware', () => {
  let user;
  beforeAll(async () => {
    dbConnect(mongoose);

    const data = await setup(models, { userCount: 1 });
    [user] = data.users;
  });

  afterAll(async () => {
    const collections = ['users'];
    return teardown(mongoose, collections);
  });

  describe('exchangeSlugForUser', () => {
    test('user is found for @username slug: req.pathUser contains matching User', async () => {
      const req = { ...reqBase };
      req.params = { usernameSlug: `@${user.username}` };

      const next = () => {
        expect(req.pathUser).toBeDefined();
        expect(req.pathUser.id).toEqual(user.id);
      };

      await exchangeSlugForUser(req, null, next);
    });

    test('no user found for @username slug: req.pathUser is null', async () => {
      const req = { ...reqBase };
      req.params = { usernameSlug: `@doesntexist` };

      const next = () => expect(req.pathUser).toBeNull();
      
      await exchangeSlugForUser(req, null, next);
    });
  });

  describe('userNotFoundRedirect', () => {
    test('req.pathUser is defined: calls next()', async () => {
      const req = { ...reqBase };
      req.pathUser = user;
      const next = jest.fn().mockImplementation(() => {});
      
      await userNotFoundRedirect(req, null, next);
      expect(next).toHaveBeenCalled();
    });

    test('req.pathUser is null: returns a 404 JSON response { error: "user not found" }', async () => {
      const req = { ...reqBase, params: { usernameSlug: `@doesntexist` } };
      const resMock = {
        status: jest.fn(() => resMock),
        json: jest.fn(),
      };
      
      await userNotFoundRedirect(req, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'user not found' });
    });
  });
});
