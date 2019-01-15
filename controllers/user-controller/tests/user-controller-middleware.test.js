require('dotenv').config();
const mongoose = require('mongoose');
const mockRes = require('jest-mock-express').response

const models = require('../../../models');
const { setup, teardown } = require('../../../test-utils');
const [exchangeSlugForUser, userNotFoundRedirect] = require('../user-controller-middleware');

const reqBase = { models }; // base request object
describe('[/user/:@username] Middleware', () => {
  let user;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 1 });
    [user] = data.users;
  });

  afterAll(async () => {
    const collections = ['users'];
    return teardown(mongoose, collections);
  });

  describe('exchangeSlugForUser', () => {
    test('adds .pathUser property when matching User is found', async () => {
      const req = { ...reqBase };
      req.params = { usernameSlug: `@${user.username}` };

      const next = () => {
        expect(req.pathUser).toBeDefined();
        expect(req.pathUser.id).toEqual(user.id);
      };

      await exchangeSlugForUser(req, null, next);
    });

    test('req.pathUser is null when no matching User is found', async () => {
      const req = { ...reqBase };
      req.params = { usernameSlug: `@doesntexist` };

      const next = () => expect(req.pathUser).toBeNull();
      
      await exchangeSlugForUser(req, null, next);
    });
  });

  describe('userNotFoundRedirect', () => {
    test('calls next() if req.pathUser is defined', async () => {
      const req = { ...reqBase };
      req.pathUser = user;
      const next = jest.fn().mockImplementation(() => {});
      
      await userNotFoundRedirect(req, null, next);
      expect(next).toHaveBeenCalled();
    });

    test('returns a 404 response if req.pathUser is null', async () => {
      const req = { ...reqBase };
      req.params = { usernameSlug: `@doesntexist` };
      const res = mockRes();
      
      const response = await userNotFoundRedirect(req, res);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });
});
