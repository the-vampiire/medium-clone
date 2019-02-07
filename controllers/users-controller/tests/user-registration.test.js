const { User } = require('../../../models');
const { verifyPayload, checkDuplicate, registerUser } = require('../user-registration');

const resMock = {
  status() { return this; },
  json: output => output,
};

const statusSpy = jest.spyOn(resMock, 'status');
const jsonSpy = jest.spyOn(resMock, 'json');
const nextSpy = jest.fn(() => {});

const username = 'a-username';
const password = 'a password';
const verifyPassword = password;

describe('POST /users: User registration middleware and handler', () => {
  afterEach(() => {
    statusSpy.mockClear();
    jsonSpy.mockClear();
    nextSpy.mockClear();
  });

  describe('verifyPayload() middleware', () => {
    test('valid body contents: calls next()', () => {
      const body = { username, password, verifyPassword };
      verifyPayload({ body }, resMock, nextSpy);
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
      expect(nextSpy).toHaveBeenCalled();
    });
    
    // runs through each failure scenario and tests the behavior
    [
      { scenario: 'username missing', body: { password, verifyPassword }, expectedOutput: { error: 'username required' } },
      { scenario: 'password missing', body: { username, verifyPassword }, expectedOutput: { error: 'password required' } },
      { scenario: 'verifyPassword missing', body: { username, password }, expectedOutput: { error: 'verifyPassword required' } },
      { scenario: 'passwords do not match', body: { username, password: 'other', verifyPassword }, expectedOutput: { error: 'Passwords do not match' } },
    ].forEach(({ scenario, body, expectedOutput }) => {
        test(`${scenario}: { status: 400, body: { error: ${expectedOutput.error} } }`, () => {
          verifyPayload({ body }, resMock, nextSpy);
          expect(statusSpy).toHaveBeenCalledWith(400);
          expect(jsonSpy).toHaveBeenCalledWith(expectedOutput);
          expect(nextSpy).not.toHaveBeenCalled();
        });
      });
  });

  describe('checkDuplicate() middleware', () => {
    test('username available: calls next()', async () => {
      const body = { username };
      const models = { User: { countDocuments: () => 0 } };

      await checkDuplicate({ body, models }, resMock, nextSpy);
      expect(nextSpy).toHaveBeenCalled();
    });

    test('username taken: { status: 409, body: { error: "Username already registered" } }', async () => {
      const body = { username };
      const models = { User: { countDocuments: () => 1 } };

      await checkDuplicate({ body, models }, resMock, nextSpy); 
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Username already registered' });
    });
  });

  describe('registerUser() POST handler', () => {
    test('registers a user and returns the User Response Shape', async () => {
      const userMock = new User({ id: 1, username, password, avatarURL: 'url' });
      const body = { username, password };
      const models = { User: { create: () => userMock } };
      const createSpy = jest.spyOn(models.User, 'create');
      
      await registerUser({ body, models }, resMock);
      expect(createSpy).toHaveBeenCalledWith(body);
      expect(jsonSpy).toHaveBeenCalledWith(userMock.toResponseShape());
    });

    test("invalid username or password: { status: 400, error: <Model Validation Error Message> }", async () => {
      const errorMessage = 'Validation Error';
      const validationError = new Error(errorMessage);
      const models = { User: { create: () => { throw validationError } } };

      await registerUser({ body: {}, models }, resMock);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
