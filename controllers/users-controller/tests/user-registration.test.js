const {
  verifyRegistrationPayload,
  checkDuplicateRegistration,
  registerUserHandler,
} = require('../user-registration');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
  set: jest.fn(),
};

const nextMock = jest.fn(() => {});

const username = 'a-username';
const password = 'a password';
const verifyPassword = password;

describe('POST /users: User registration middleware and handler', () => {
  describe('verifyRegistrationPayload() middleware', () => {
    beforeEach(() => jest.clearAllMocks());
    
    test('valid body contents: calls next()', () => {
      const body = { username, password, verifyPassword };
      verifyRegistrationPayload({ body }, resMock, nextMock);
      expect(resMock.status).not.toHaveBeenCalled();
      expect(resMock.json).not.toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalled();
    });
    
    // runs through each failure scenario and tests the behavior
    [
      { scenario: 'username missing', body: { password, verifyPassword }, expectedOutput: { error: 'username required' } },
      { scenario: 'password missing', body: { username, verifyPassword }, expectedOutput: { error: 'password required' } },
      { scenario: 'verifyPassword missing', body: { username, password }, expectedOutput: { error: 'verifyPassword required' } },
      { scenario: 'passwords do not match', body: { username, password: 'other', verifyPassword }, expectedOutput: { error: 'passwords do not match' } },
    ].forEach(({ scenario, body, expectedOutput }) => {
        test(`${scenario}: { status: 400, body: { error: ${expectedOutput.error} } }`, () => {
          verifyRegistrationPayload({ body }, resMock, nextMock);
          expect(resMock.status).toHaveBeenCalledWith(400);
          expect(resMock.json).toHaveBeenCalledWith(expectedOutput);
          expect(nextMock).not.toHaveBeenCalled();
        });
      });
  });

  describe('checkDuplicateRegistration() middleware', () => {
    beforeEach(() => jest.clearAllMocks());

    test('username available: calls next()', async () => {
      const body = { username };
      const models = { User: { countDocuments: () => 0 } };

      await checkDuplicateRegistration({ body, models }, resMock, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });

    test('username taken: { status: 409, body: { error: "username already registered" } }', async () => {
      const body = { username };
      const models = { User: { countDocuments: () => 1 } };

      await checkDuplicateRegistration({ body, models }, resMock, nextMock); 
      expect(resMock.status).toHaveBeenCalledWith(409);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'username already registered' });
    });
  });

  describe('registerUserHandler() POST handler', () => {
    describe('valid username and password', () => {
      const body = { username, password };
      const UserMock = { create: jest.fn(() => userMock) };
      const responseShapeMock = { links: { userURL: 'this is a url' } };
      const userMock = { username, password, toResponseShape: jest.fn(() => responseShapeMock) };
      const models = { User: UserMock };

      beforeAll(() => registerUserHandler({ body, models }, resMock));
      afterAll(() => jest.clearAllMocks());

      test('creates a new User and converts it to the User Response Shape', async () => {
        expect(UserMock.create).toHaveBeenCalledWith(body);
        expect(userMock.toResponseShape).toHaveBeenCalled();
      });

      test('sets Location header to the newly created User resource URL', () => {
        expect(resMock.set).toHaveBeenCalledWith({ Location: responseShapeMock.links.userURL });
      });

      test('returns a 201 JSON response with the User Response Shape', () => {
        expect(resMock.status).toHaveBeenCalledWith(201);
        expect(resMock.json).toHaveBeenCalledWith(userMock.toResponseShape());
      });
    });
    
    test("invalid username or password: 400 JSON response with { error: 'validation failed', fields: { ... } }", async () => {
      const validationError = new Error(JSON.stringify({ errors: {} }));
      const models = { User: { create: () => { throw validationError } } };

      await registerUserHandler({ body: {}, models }, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'validation failed', fields: {} });
    });
  });
});
