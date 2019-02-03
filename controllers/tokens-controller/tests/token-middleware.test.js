const { User } = require('../../../models');
const { verifyPayload, authenticateRequest } = require('../token-middleware');

const resMock = {
  status() { return this; },
  json: content => content,
};

const statusSpy = jest.spyOn(resMock, 'status');
const jsonSpy = jest.spyOn(resMock, 'json');
const nextSpy = jest.fn(() => {});

const username = 'the-vampiire';
const password = 'some password';

describe('Token Controller Middleware', () => {
  afterEach(() => {
    statusSpy.mockClear();
    jsonSpy.mockClear();
    nextSpy.mockClear();
  });

  describe('verifyPayload(): verifies the contents of the authentication payload', () => {
    test('calls next() with valid payload', () => {
      const body = { username, password };
      verifyPayload({ body }, resMock, nextSpy);
      expect(nextSpy).toBeCalled();
    });

    test('no username: responds with 400 status and { error: "username missing" }', () => {
      const body = { password };
      verifyPayload({ body }, resMock, nextSpy);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'username missing' });
    });
  
    test('no password: responds with 400 status and { error: "password missing" }', () => {
      const body = { username };
      verifyPayload({ body }, resMock, nextSpy);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'password missing' });
    });
  });

  describe('authenticateRequest(): authenciates the User', () => {
    test.only('successful authentication: adds req.authedUser and calls next()', async () => {
      const body = { username, password };
      const userMock = new User({ username, password });
      userMock.verifyPassword = function () { return true; }

      const models = { User: { findOne: () => userMock } };
      const reqMock = { body, models };

      await authenticateRequest(reqMock, resMock, nextSpy);
      expect(reqMock.authedUser).toBeDefined();
      expect(nextSpy).toHaveBeenCalled();
    });

    test('failed authentication: responds with 401 status and { error }', async () => {
      const body = { username, password };
      const userMock = new User({ username, password: 'different' });
      const models = { User: { findOne: () => userMock } };
      
      await authenticateRequest({ body, models }, resMock, nextSpy);
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'failed to authenticate' });
    });
  });
});