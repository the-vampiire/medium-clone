const { testManager, extractCookies, request, app } = require('./utils');


/**
 * --------------------------
 * COVERS: Authentication / Tokens
 * --------------------------
 * Tokens Controller [/tokens]
 * - POST: create refresh token
 * - DELETE: delete refresh token
 * - POST /access_token: create access token
 */

const tm = new testManager({});

describe('Integration Tests: Authentication and Token Interactions', () => {
  beforeAll(async ()=> {
    tm.dbConnect();
    await tm.registerUsers();
  });
  afterAll(() => tm.teardown());

  describe('POST /tokens: authenticates a user and returns a refresh token via cookie', () => {
    tm.users.forEach(
      user => test(`retrieves a refresh token for: ${user.username}`, async () => {
        const res = await request(app).post('/tokens').send(user);
        const { refresh_token: refreshToken } = extractCookies(res.headers);
        expect(refreshToken).toBeDefined();
        user.refreshToken = refreshToken;
      }),
    );
  });

  describe('POST /tokens/access_token: validates the refresh token and returns an access token via JSON body', () => {
    tm.users.forEach(
      user => test(`retrieves an access token for: ${user.username}`, async () => {
        const res = await request(app).post('/tokens/access_token')
        .set('cookie', `refresh_token=${user.refreshToken.value}`);
        
        expect(res.body.access_token).toBeDefined();
      }),
    )
  });

  describe('DELETE /tokens: invalidates the refresh token', () => {
    test('returns a 204 response', (done) => tm.users.forEach(
      user => request(app).delete('/tokens').set(
        'cookie',
        `refresh_token=${user.refreshToken.value}`,
      ).expect(204, done)
    ));

    test('requesting an access token after revocation responds with 401 rejection', (done) => tm.users.forEach(
      user => request(app).post('/tokens/access_token').set(
        'cookie',
        `refresh_token=${user.refreshToken.value}`,
      ).expect(401, done)
    ));
  });
});