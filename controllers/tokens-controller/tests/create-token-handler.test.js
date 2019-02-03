const createTokenHandler = require('../create-token-handler');
const { setupEnv, teardownEnv, authedUserMock } = require('./mocks');


describe('POST /tokens handler', () => {
  beforeAll(() => setupEnv());
  afterAll(() => teardownEnv());

  test('createTokenHandler(): returns a 200 JSON content response { token }', () => {
    const reqMock = { authedUser: authedUserMock };
    const resMock = { json: content => content };
    const jsonSpy = jest.spyOn(resMock, 'json');

    const output = createTokenHandler(reqMock, resMock);
    expect(jsonSpy).toHaveBeenCalled();
    expect(output.token).toBeDefined();
  });
});