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
});