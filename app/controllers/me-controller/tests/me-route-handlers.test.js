const { getMeHandler } = require('../me-route-handlers');

const resMock = {
  json: jest.fn(),
};

describe('Me Controller route handlers', () => {
  test('getMeHandler(): retrieves the authed user in User Response Shape', () => {
    const authedUser = { toResponseShape: jest.fn() };
    const reqMock = { context: { authedUser } };

    getMeHandler(reqMock, resMock);
    expect(resMock.json).toBeCalledWith(authedUser.toResponseShape());
  });
});
