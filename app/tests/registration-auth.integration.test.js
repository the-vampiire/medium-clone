const { testManager, request, app } = require('./utils');

const tm = new testManager({});
const { DOMAIN } = process.env;

/**
 * --------------------------
 * COVERS: registration and authentication
 * --------------------------
 * Users Controller [/users]
 * - POST: register new user
 * 
 * User Controller [/users/@username]
 * - GET: retrieve path user's details
 * 
 * Tokens Controller [/tokens]
 * - POST: create authentication token
 */

describe('Integration Tests: Registration and Authentication Interactions', () => {
  beforeAll(()=> tm.dbConnect());
  afterAll(() => tm.teardown());

  describe('POST: registering new users', () => {
    tm.users.forEach(
      user => test(`registers: ${user.username}`, () => {
        return request(app).post('/users').send({ ...user })
          .expect(201)
          .expect('Location', `${DOMAIN}/users/@${user.username}`);
      }),
    );
  });

  describe('GET /users/@username: requesting user details', () => {
    tm.users.forEach(
      user => test(`retrieves user details for: ${user.username}`, async () => {
        const { body } = await request(app).get(`/users/@${user.username}`);
        const { username, links } = body;

        expect(username).toBe(user.username);
        expect(links).toBeDefined();
      }),
    );
  });

  describe('POST /tokens: authenticating a user', () => {
    tm.users.forEach(
      user => test(`authenticates: ${user.username}`, async () => {
        const { username, password } = user;
        const res = await request(app).post('/tokens').send({ username, password });
        const { body } = res;
        expect(body.token).toBeDefined();
        user.token = body.token;
      }),
    );
  });
});
